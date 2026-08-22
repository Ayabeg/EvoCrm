<?php

namespace App\Services\Desk;

use App\Enums\ChannelType;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Evolution\EvolutionCloudService;

class DeskComposer
{
    public function __construct(private EvolutionCloudService $evolution) {}

    public function reply(Thread $thread, User $user, string $body): Message
    {
        $channel = $thread->channel;
        $isWhatsApp = $channel->type === ChannelType::WhatsAppCloud;

        $message = Message::query()->create([
            'workspace_id' => $thread->workspace_id,
            'thread_id' => $thread->id,
            'contact_id' => $thread->contact_id,
            'user_id' => $user->id,
            'direction' => 'outbound',
            'type' => 'text',
            'body' => $body,
            'status' => 'queued',
            'provider' => $isWhatsApp ? 'evolution_cloud' : $channel->type->value,
        ]);

        if ($isWhatsApp) {
            $this->sendViaEvolution($message, $thread, $body);
        } else {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Channel '.$channel->type->value.' is not sendable in this slice.',
            ])->save();
        }

        $thread->forceFill(['last_message_at' => now()])->save();

        return $message->fresh();
    }

    protected function sendViaEvolution(Message $message, Thread $thread, string $body): void
    {
        if (! $this->evolution->configured()) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'Evolution Cloud is not connected. Outbound stored as failed.',
            ])->save();

            return;
        }

        $number = (string) $thread->contact->phone_e164;
        $result = $this->evolution->sendText($number, $body);

        $message->forceFill([
            'status' => $result['ok'] ? 'sent' : 'failed',
            'provider_message_id' => data_get($result, 'body.key.id') ?? data_get($result, 'body.id'),
            'failure_reason' => $result['ok'] ? null : ($result['error'] ?? 'Send failed'),
            'payload' => $result['body'] ?? null,
        ])->save();
    }
}
