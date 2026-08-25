<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\Workspace;
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
    public function __construct(private WorkflowRunner $workflows) {}

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
            OP_READONLY,
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

        $lastOutbound = OutboundMessage::query()
            ->forWorkspace($mailbox->workspace_id)
            ->where('contact_id', $contact->id)
            ->where('direction', 'out')
            ->where('status', 'sent')
            ->latest('sent_at')
            ->first();

        OutboundMessage::query()->create([
            'workspace_id' => $mailbox->workspace_id,
            'contact_id' => $contact->id,
            'mailbox_id' => $mailbox->id,
            'sequence_id' => $lastOutbound?->sequence_id,
            'channel' => 'email',
            'direction' => 'in',
            'to_address' => $mailbox->from_address,
            'message_id' => $messageId,
            'in_reply_to' => $lastOutbound?->id,
            'subject' => $subject,
            'body' => mb_substr(trim((string) $body), 0, 10000),
            'status' => 'received',
        ]);

        if ($lastOutbound && ! $lastOutbound->replied_at) {
            $lastOutbound->forceFill(['replied_at' => now()])->save();
            $this->branchEnrollmentOnReply($contact, $lastOutbound);
            $this->pauseEnrollmentOnReply($contact, $lastOutbound);
        }
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

    protected function branchEnrollmentOnReply(Contact $contact, OutboundMessage $outbound): void
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

        $step = $enrollment->sequence?->steps->firstWhere('position', $enrollment->next_step - 1)
            ?? $enrollment->sequence?->steps->firstWhere('position', $enrollment->next_step);

        if (! $step?->on_reply_step) {
            return;
        }

        $enrollment->forceFill([
            'next_step' => (int) $step->on_reply_step,
            'next_run_at' => now(),
        ])->save();
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
