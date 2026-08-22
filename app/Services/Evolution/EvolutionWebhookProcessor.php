<?php

namespace App\Services\Evolution;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\EvolutionEvent;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Workspace;
use App\Services\Crm\ContactIdentity;
use App\Support\AlgerianPhone;
use Illuminate\Support\Arr;

class EvolutionWebhookProcessor
{
    public function __construct(private ContactIdentity $contacts) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(Workspace $workspace, array $payload): ?Message
    {
        $event = (string) ($payload['event'] ?? $payload['type'] ?? 'MESSAGES_UPSERT');

        EvolutionEvent::query()->create([
            'workspace_id' => $workspace->id,
            'instance' => $payload['instance'] ?? config('evolution.instance'),
            'event' => $event,
            'payload' => $payload,
            'received_at' => now(),
        ]);

        $workspace->forceFill([
            'evolution_last_webhook_at' => now(),
            'evolution_last_event' => $event,
        ])->save();

        if (! in_array($event, ['MESSAGES_UPSERT', 'messages.upsert', 'message', 'click_to_whatsapp'], true)) {
            return null;
        }

        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $fromMe = (bool) Arr::get($data, 'key.fromMe', Arr::get($data, 'fromMe', false));
        $jid = (string) (Arr::get($data, 'key.remoteJid')
            ?? Arr::get($data, 'remoteJid')
            ?? Arr::get($data, 'sender')
            ?? Arr::get($data, 'from')
            ?? '');

        $phone = AlgerianPhone::fromJid($jid) ?? AlgerianPhone::normalize(
            (string) (Arr::get($data, 'phone') ?? Arr::get($payload, 'phone') ?? '')
        );

        if ($phone === null) {
            return null;
        }

        $body = $this->extractBody($data);
        $pushName = (string) (Arr::get($data, 'pushName') ?? Arr::get($payload, 'pushName') ?? 'WhatsApp');

        $contact = $this->contacts->findOrCreate($workspace, [
            'first_name' => $pushName !== '' ? $pushName : 'WhatsApp',
            'phone' => $phone,
            'source' => 'evolution_cloud',
        ]);

        $channel = $this->whatsAppChannel($workspace);
        $thread = Thread::query()->firstOrCreate(
            [
                'channel_id' => $channel->id,
                'contact_id' => $contact->id,
            ],
            [
                'workspace_id' => $workspace->id,
                'status' => 'open',
                'subject' => 'WhatsApp Cloud',
            ]
        );

        $message = Message::query()->create([
            'workspace_id' => $workspace->id,
            'thread_id' => $thread->id,
            'contact_id' => $contact->id,
            'direction' => $fromMe ? 'outbound' : 'inbound',
            'type' => 'text',
            'body' => $body,
            'status' => 'received',
            'provider' => 'evolution_cloud',
            'provider_message_id' => Arr::get($data, 'key.id') ?? Arr::get($data, 'id'),
            'payload' => $payload,
        ]);

        $thread->forceFill(['last_message_at' => now()])->save();

        return $message;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function extractBody(array $data): string
    {
        return (string) (
            Arr::get($data, 'message.conversation')
            ?? Arr::get($data, 'message.extendedTextMessage.text')
            ?? Arr::get($data, 'conversation')
            ?? Arr::get($data, 'text')
            ?? Arr::get($data, 'body')
            ?? ''
        );
    }

    protected function whatsAppChannel(Workspace $workspace): Channel
    {
        return Channel::query()->firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'type' => ChannelType::WhatsAppCloud,
            ],
            [
                'name' => 'WhatsApp Cloud',
                'status' => 'connected',
            ]
        );
    }
}
