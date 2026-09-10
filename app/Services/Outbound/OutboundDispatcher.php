<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Desk\AlgerianSms;
use App\Services\Evolution\EvolutionCloudService;

class OutboundDispatcher
{
    public function __construct(
        private MailerFactory $mailers,
        private SuppressionService $suppressions,
        private QuietHoursGuard $quietHours,
        private EvolutionCloudService $evolution,
        private TemplateRenderer $templates,
        private ProductAnalytics $analytics,
        private AlgerianSms $sms,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function dispatch(Workspace $workspace, Contact $contact, array $attributes): OutboundMessage
    {
        $channel = $attributes['channel'] ?? 'email';
        $to = match ($channel) {
            'whatsapp_cloud', 'sms' => (string) $contact->phone_e164,
            default => (string) ($attributes['to_address'] ?? $contact->email),
        };

        $message = OutboundMessage::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'mailbox_id' => $attributes['mailbox_id'] ?? null,
            'sequence_id' => $attributes['sequence_id'] ?? null,
            'campaign_id' => $attributes['campaign_id'] ?? null,
            'channel' => $channel,
            'direction' => 'out',
            'to_address' => $to,
            'subject' => $this->templates->render($attributes['subject'] ?? null, $contact, $workspace),
            'body' => $this->templates->render($attributes['body'] ?? null, $contact, $workspace),
            'body_html' => $this->templates->render($attributes['body_html'] ?? null, $contact, $workspace),
            'status' => 'queued',
        ]);

        if ($this->suppressions->isSuppressed($workspace, $contact->email, $contact->phone_e164)) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Recipient is on the suppression list.',
            ])->save();

            return $message;
        }

        if ($this->quietHours->blocks($workspace)) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Blocked by quiet hours (Africa/Algiers).',
            ])->save();

            return $message;
        }

        if ($channel === 'whatsapp_cloud') {
            return $this->sendWhatsAppTemplate($message, $contact, $attributes);
        }

        if ($channel === 'sms') {
            return $this->sendSms($message, $contact, $workspace);
        }

        $mailbox = $this->mailers->resolve(
            $workspace,
            ! empty($attributes['mailbox_id'])
                ? Mailbox::query()->forWorkspace($workspace)->find($attributes['mailbox_id'])
                : null,
        );

        if ($mailbox && (int) $message->mailbox_id !== (int) $mailbox->id) {
            $message->forceFill(['mailbox_id' => $mailbox->id])->save();
        }

        $sent = $this->mailers->for($workspace, $mailbox)->send($message);
        $this->recordOutbound($workspace, $sent);

        return $sent;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function sendSequenceStep(Workspace $workspace, Sequence $sequence, Contact $contact, array $attributes = []): OutboundMessage
    {
        return $this->dispatch($workspace, $contact, array_merge($attributes, [
            'sequence_id' => $sequence->id,
            'channel' => $attributes['channel'] ?? $sequence->channel,
        ]));
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function sendWhatsAppTemplate(OutboundMessage $message, Contact $contact, array $attributes): OutboundMessage
    {
        $template = $attributes['wa_template_name'] ?? null;

        if (! $template) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'WhatsApp template name is required. Session text is Desk-only.',
            ])->save();

            return $message;
        }

        if (! $this->evolution->configured()) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Evolution Cloud is not connected.',
            ])->save();

            return $message;
        }

        $result = $this->evolution->sendTemplate(
            (string) $contact->phone_e164,
            $template,
            $attributes['wa_template_language'] ?? (string) config('evolution.meta.language', 'fr'),
        );

        $message->forceFill([
            'status' => $result['ok'] ? 'sent' : 'failed',
            'failure_reason' => $result['ok'] ? null : ($result['error'] ?? 'Template send failed'),
            'sent_at' => $result['ok'] ? now() : null,
        ])->save();

        $this->recordOutbound($contact->workspace ?? $message->workspace, $message);

        return $message;
    }

    protected function sendSms(OutboundMessage $message, Contact $contact, Workspace $workspace): OutboundMessage
    {
        $result = $this->sms->send($workspace, $contact->phone_e164, (string) $message->body, allowStub: false);

        $message->forceFill([
            'status' => $result['ok'] ? 'sent' : 'failed',
            'failure_reason' => $result['ok'] ? null : ($result['error'] ?? 'SMS send failed'),
            'sent_at' => $result['ok'] ? now() : null,
            'to_address' => $result['e164'] ?: $message->to_address,
            'provider_event_id' => $result['id'],
        ])->save();

        return $message;
    }

    private function recordOutbound(?Workspace $workspace, OutboundMessage $message): void
    {
        if ($message->status !== 'sent' || ! $workspace instanceof Workspace) {
            return;
        }

        $event = $message->channel === 'whatsapp_cloud'
            ? ProductAnalytics::WHATSAPP_MESSAGE_SENT
            : ProductAnalytics::EMAIL_SENT;

        $this->analytics->capture($event, [
            'message_id' => $message->id,
            'channel' => $message->channel,
            'contact_id' => $message->contact_id,
            'sequence_id' => $message->sequence_id,
            'campaign_id' => $message->campaign_id,
        ], null, $workspace);
    }
}
