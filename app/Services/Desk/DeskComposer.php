<?php

namespace App\Services\Desk;

use App\Enums\ChannelType;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Crm\WorkflowExecutionRedactor;
use App\Services\Evolution\EvolutionCloudService;

class DeskComposer
{
    public function __construct(
        private EvolutionCloudService $evolution,
        private AlgerianSms $sms,
    ) {}

    public function reply(Thread $thread, User $user, string $body): Message
    {
        $channel = $thread->channel;
        $isWhatsApp = in_array($channel->type, [ChannelType::WhatsApp, ChannelType::WhatsAppCloud], true);
        $isSms = $channel->type === ChannelType::Sms;

        $message = Message::query()->create([
            'workspace_id' => $thread->workspace_id,
            'thread_id' => $thread->id,
            'contact_id' => $thread->contact_id,
            'user_id' => $user->id,
            'direction' => 'outbound',
            'type' => 'text',
            'body' => $body,
            'status' => 'queued',
            'provider' => $isWhatsApp
                ? ($channel->type === ChannelType::WhatsApp ? 'evolution_whatsapp' : 'evolution_cloud')
                : ($isSms ? 'sms' : $channel->type->value),
        ]);

        if ($isWhatsApp) {
            $this->sendViaEvolution($message, $thread, $body);
        } elseif ($isSms) {
            $this->sendViaSms($message, $thread, $body);
        } else {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Channel '.$channel->type->value.' is not sendable in this slice.',
            ])->save();
        }

        $thread->forceFill(['last_message_at' => now()])->save();

        $linked = Ticket::query()
            ->forWorkspace($thread->workspace_id)
            ->where('thread_id', $thread->id)
            ->first();
        $linked?->markFirstResponse();

        return $message->fresh();
    }

    protected function sendViaEvolution(Message $message, Thread $thread, string $body): void
    {
        if (! $this->evolution->configured()) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Evolution is not connected. Outbound stored as failed.',
            ])->save();

            return;
        }

        $number = (string) $thread->contact->phone_e164;
        $kind = $thread->channel->type === ChannelType::WhatsApp
            ? EvolutionCloudService::KIND_WHATSAPP
            : EvolutionCloudService::KIND_WHATSAPP_BUSINESS;
        $instance = $thread->workspace?->integration(
            $kind === EvolutionCloudService::KIND_WHATSAPP
                ? Integration::PROVIDER_WHATSAPP
                : Integration::PROVIDER_WHATSAPP_BUSINESS
        )?->meta['instance'] ?? $this->evolution->instanceName($thread->workspace, $kind);
        $result = $this->evolution->sendText($number, $body, $instance);

        $message->forceFill([
            'status' => $result['ok'] ? 'sent' : 'failed',
            'provider_message_id' => data_get($result, 'body.key.id') ?? data_get($result, 'body.id'),
            'failure_reason' => $result['ok']
                ? null
                : app(WorkflowExecutionRedactor::class)->redactError($result['error'] ?? 'Send failed'),
            'payload' => $result['body'] ?? null,
        ])->save();
    }

    protected function sendViaSms(Message $message, Thread $thread, string $body): void
    {
        $raw = $thread->contact?->phone_e164 ?? $thread->contact?->phone;

        if (! filled($raw)) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Contact has no phone number for SMS.',
            ])->save();

            return;
        }

        $workspace = $thread->workspace ?? $message->workspace;
        $result = $this->sms->send($workspace, $raw, $body, allowStub: true);

        $message->forceFill([
            'status' => $result['ok'] ? 'sent' : 'failed',
            'provider' => $result['stub'] ? 'sms' : ($result['provider'] ?? 'sms'),
            'provider_message_id' => $result['id'] ?? null,
            'failure_reason' => $result['ok']
                ? null
                : app(WorkflowExecutionRedactor::class)->redactError($result['error'] ?? 'Send failed'),
            'payload' => array_filter([
                ...((array) ($result['body'] ?? [])),
                'stub' => $result['stub'] ? true : null,
                'to' => $result['e164'] ?? null,
            ], fn ($value) => $value !== null),
        ])->save();
    }
}
