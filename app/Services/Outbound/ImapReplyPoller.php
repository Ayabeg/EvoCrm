<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\WorkflowRunner;
use RuntimeException;

/**
 * IMAP reply poller. For each enabled mailbox with IMAP settings, fetches
 * UNSEEN mail, matches the sender to a CRM contact, records an inbound
 * OutboundMessage, and marks the latest outbound send to that contact as
 * replied. Requires ext-imap on the worker; without it poll() fails loudly
 * so the misconfiguration is visible instead of silently doing nothing.
 */
class ImapReplyPoller
{
    public function __construct(
        private WorkflowRunner $workflows,
        private ProductAnalytics $analytics,
        private ReplyClassifier $classifier,
        private SuppressionService $suppressions,
    ) {}

    /**
     * @return array{mailbox: string, replies: int, error: string|null}
     */
    public function pollMailbox(Mailbox $mailbox): array
    {
        if (! $mailbox->enabled || ! $mailbox->imapConfigured()) {
            return ['mailbox' => $mailbox->name, 'replies' => 0, 'error' => 'IMAP not configured.'];
        }

        if (! function_exists('imap_open')) {
            throw new RuntimeException(
                'PHP ext-imap is not installed. Install php-imap on the worker to poll replies.'
            );
        }

        $encryption = $mailbox->imap_encryption ?: 'ssl';
        $port = $mailbox->imap_port ?? ($encryption === 'ssl' ? 993 : 143);
        $flags = $encryption === 'none' ? 'notls' : $encryption;
        $mailboxDsn = sprintf('{%s:%d/imap/%s}INBOX', $mailbox->imap_host, $port, $flags);

        $stream = @imap_open(
            $mailboxDsn,
            (string) $mailbox->imap_username,
            (string) $mailbox->imap_password,
            0,
        );

        if (! $stream) {
            return [
                'mailbox' => $mailbox->name,
                'replies' => 0,
                'error' => imap_last_error() ?: 'IMAP connection failed.',
            ];
        }

        $replies = 0;
        $uids = imap_search($stream, 'UNSEEN', SE_UID) ?: [];

        foreach ($uids as $uid) {
            $from = $this->senderAddress($stream, $uid);

            if (! $from) {
                continue;
            }

            $contact = Contact::query()
                ->forWorkspace($mailbox->workspace_id)
                ->whereRaw('LOWER(email) = ?', [strtolower($from)])
                ->first();

            if (! $contact) {
                continue;
            }

            $this->recordReply($mailbox, $contact, $stream, $uid);
            // Only mark a message seen after its CRM record is persisted. If
            // the flag operation fails, the provider message ID/UID fallback
            // still makes the next poll idempotent.
            if (function_exists('imap_setflag_full')) {
                @imap_setflag_full($stream, (string) $uid, '\\Seen', ST_UID);
            }
            $replies++;
        }

        imap_close($stream);

        return ['mailbox' => $mailbox->name, 'replies' => $replies, 'error' => null];
    }

    /**
     * Poll every enabled, IMAP-configured mailbox in the workspace.
     *
     * @return array<int, array{mailbox: string, replies: int, error: string|null}>
     */
    public function poll(Workspace $workspace): array
    {
        return Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->get()
            ->filter(fn (Mailbox $mailbox) => $mailbox->imapConfigured())
            ->map(fn (Mailbox $mailbox) => $this->pollMailbox($mailbox))
            ->values()
            ->all();
    }

    protected function recordReply(Mailbox $mailbox, Contact $contact, mixed $stream, int $uid): void
    {
        $header = imap_headerinfo($stream, imap_msgno($stream, $uid));
        $subject = isset($header->subject) ? $this->decodeHeader($header->subject) : null;
        $body = imap_body($stream, $uid, FT_UID | FT_PEEK);
        $messageId = isset($header->message_id) ? trim((string) $header->message_id) : null;
        $messageId = $messageId !== '' ? $messageId : "imap:{$mailbox->id}:{$uid}";

        $this->recordContactReply($mailbox, $contact, [
            'subject' => $subject,
            'body' => $body,
            'message_id' => $messageId,
        ]);
    }

    /**
     * IMAP mailbox path (no new ESP): persist an inbound reply, then either
     * branch the enrollment or pause it. Used by pollMailbox and tests.
     *
     * @param  array{subject?: ?string, body?: ?string, message_id?: ?string}  $mail
     */
    public function recordContactReply(Mailbox $mailbox, Contact $contact, array $mail = []): OutboundMessage
    {
        $lastOutbound = OutboundMessage::query()
            ->forWorkspace($mailbox->workspace_id)
            ->where('contact_id', $contact->id)
            ->where('direction', 'out')
            ->where('status', 'sent')
            ->latest('sent_at')
            ->first();

        $providerMessageId = trim((string) ($mail['message_id'] ?? ''));
        $classification = $this->classifier->classify($mail['subject'] ?? null, $mail['body'] ?? null);
        $inbound = $providerMessageId !== ''
            ? OutboundMessage::query()
                ->forWorkspace($mailbox->workspace_id)
                ->where('mailbox_id', $mailbox->id)
                ->where('direction', 'in')
                ->where('message_id', $providerMessageId)
                ->first()
            : null;

        $inbound ??= OutboundMessage::query()->create([
            'workspace_id' => $mailbox->workspace_id,
            'contact_id' => $contact->id,
            'mailbox_id' => $mailbox->id,
            'sequence_id' => $lastOutbound?->sequence_id,
            'channel' => 'email',
            'direction' => 'in',
            'to_address' => $mailbox->from_address,
            'message_id' => $providerMessageId !== '' ? $providerMessageId : null,
            'in_reply_to' => $lastOutbound?->id,
            'subject' => $mail['subject'] ?? null,
            'body' => mb_substr(trim((string) ($mail['body'] ?? '')), 0, 10000),
            'status' => 'received',
            'reply_classification' => $classification['label'],
            'reply_classification_confidence' => $classification['confidence'],
            'reply_classified_at' => now(),
        ]);

        if ($classification['label'] === ReplyClassifier::UNSUBSCRIBE && filled($contact->email)) {
            $this->suppressions->suppress(
                $mailbox->workspace,
                'email',
                (string) $contact->email,
                'reply_unsubscribe',
                'reply_classifier',
            );
        }

        if ($lastOutbound && ! $lastOutbound->replied_at) {
            $lastOutbound->forceFill(['replied_at' => now()])->save();
            $this->analytics->capture(ProductAnalytics::EMAIL_REPLIED, [
                'contact_id' => $contact->id,
                'message_id' => $lastOutbound->id,
                'sequence_id' => $lastOutbound->sequence_id,
                'mailbox_id' => $mailbox->id,
            ], null, $contact->workspace ?? $mailbox->workspace);

            if ($classification['label'] === ReplyClassifier::UNSUBSCRIBE
                || $classification['label'] === ReplyClassifier::NOT_INTERESTED
                || ! $this->branchEnrollmentOnReply($contact, $lastOutbound)) {
                $this->pauseEnrollmentOnReply($contact, $lastOutbound);
            }
        }

        return $inbound;
    }

    protected function pauseEnrollmentOnReply(Contact $contact, OutboundMessage $outbound): void
    {
        if (! $outbound->sequence_id) {
            return;
        }

        $enrollment = Enrollment::query()
            ->where('contact_id', $contact->id)
            ->where('sequence_id', $outbound->sequence_id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            return;
        }

        $enrollment->forceFill(['status' => 'paused', 'next_run_at' => null])->save();
        $this->workflows->handleEnrollmentReplied($contact, $enrollment);
    }

    protected function branchEnrollmentOnReply(Contact $contact, OutboundMessage $outbound): bool
    {
        if (! $outbound->sequence_id) {
            return false;
        }

        $enrollment = Enrollment::query()
            ->where('contact_id', $contact->id)
            ->where('sequence_id', $outbound->sequence_id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            return false;
        }

        $step = $enrollment->sequence?->steps->firstWhere('position', $enrollment->next_step - 1)
            ?? $enrollment->sequence?->steps->firstWhere('position', $enrollment->next_step);

        if (! $step?->on_reply_step) {
            return false;
        }

        $enrollment->forceFill([
            'next_step' => (int) $step->on_reply_step,
            'next_run_at' => now(),
        ])->save();

        return true;
    }

    protected function senderAddress(mixed $stream, int $uid): ?string
    {
        $header = imap_headerinfo($stream, imap_msgno($stream, $uid));
        $from = $header->from[0] ?? null;

        if (! $from) {
            return null;
        }

        $address = ($from->mailbox ?? '').'@'.($from->host ?? '');

        return str_contains($address, '@') && strlen($address) > 1 ? $address : null;
    }

    protected function decodeHeader(string $value): string
    {
        $decoded = imap_mime_header_decode($value);

        return collect($decoded)->map(fn ($part) => $part->text)->implode('');
    }
}
