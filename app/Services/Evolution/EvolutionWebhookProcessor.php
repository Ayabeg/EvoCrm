<?php

namespace App\Services\Evolution;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\EvolutionEvent;
use App\Models\Integration;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\ContactIdentity;
use App\Services\LeadOs\AfterTouchDraft;
use App\Services\LeadOs\DealHealthScorer;
use App\Support\AlgerianPhone;
use Illuminate\Support\Arr;

class EvolutionWebhookProcessor
{
    public function __construct(
        private ContactIdentity $contacts,
        private ProductAnalytics $analytics,
        private DealHealthScorer $health,
        private AfterTouchDraft $drafts,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(Workspace $workspace, array $payload): ?Message
    {
        $event = (string) ($payload['event'] ?? $payload['type'] ?? 'MESSAGES_UPSERT');
        $instance = (string) ($payload['instance'] ?? config('evolution.instance'));

        EvolutionEvent::query()->create([
            'workspace_id' => $workspace->id,
            'instance' => $instance,
            'event' => $event,
            'payload' => $payload,
            'received_at' => now(),
        ]);

        $workspace->forceFill([
            'evolution_last_webhook_at' => now(),
            'evolution_last_event' => $event,
        ])->save();

        if (in_array($event, ['CONNECTION_UPDATE', 'connection.update'], true)) {
            $this->applyConnectionUpdate($workspace, $instance, $payload);

            return null;
        }

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

        $kind = $this->kindFor($workspace, $instance);
        $isPhone = $kind === EvolutionCloudService::KIND_WHATSAPP;
        $pushName = (string) (Arr::get($data, 'pushName') ?? Arr::get($payload, 'pushName') ?? 'WhatsApp');

        $contact = $this->contacts->findOrCreate($workspace, [
            'first_name' => $pushName !== '' ? $pushName : 'WhatsApp',
            'phone' => $phone,
            'source' => $isPhone ? 'evolution_whatsapp' : 'evolution_cloud',
        ]);

        $channel = $this->whatsAppChannel($workspace, $isPhone);
        $thread = Thread::query()->firstOrCreate(
            [
                'channel_id' => $channel->id,
                'contact_id' => $contact->id,
            ],
            [
                'workspace_id' => $workspace->id,
                'status' => 'open',
                'subject' => $isPhone ? 'WhatsApp' : 'WhatsApp Business',
            ]
        );

        $message = Message::query()->create([
            'workspace_id' => $workspace->id,
            'thread_id' => $thread->id,
            'contact_id' => $contact->id,
            'direction' => $fromMe ? 'outbound' : 'inbound',
            'type' => 'text',
            'body' => $this->extractBody($data),
            'status' => 'received',
            'provider' => $isPhone ? 'evolution_whatsapp' : 'evolution_cloud',
            'provider_message_id' => Arr::get($data, 'key.id') ?? Arr::get($data, 'id'),
            'payload' => $payload,
        ]);

        $thread->forceFill(['last_message_at' => now()])->save();

        if (! $fromMe) {
            Ticket::receiveInbound($thread);
            $this->analytics->capture(ProductAnalytics::WHATSAPP_MESSAGE_RECEIVED, [
                'message_id' => $message->id,
                'contact_id' => $contact->id,
                'thread_id' => $thread->id,
            ], null, $workspace);
            $this->health->refreshOpenDealsForContact($workspace, $contact);
            $this->drafts->logInboundWhatsApp($workspace, $contact, $message);
        }

        return $message;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function applyConnectionUpdate(Workspace $workspace, string $instance, array $payload): void
    {
        $state = (string) (Arr::get($payload, 'data.state')
            ?? Arr::get($payload, 'data.instance.state')
            ?? Arr::get($payload, 'state')
            ?? '');

        $provider = $this->kindFor($workspace, $instance);
        $integration = $workspace->integration($provider);

        if (! $integration) {
            return;
        }

        $meta = $integration->meta ?? [];
        $meta['state'] = $state !== '' ? $state : ($meta['state'] ?? null);

        if ($state === 'open') {
            unset($meta['qr']);
            $integration->forceFill([
                'status' => 'connected',
                'access_token' => $integration->access_token ?: 'evolution',
                'meta' => $meta,
                'connected_at' => $integration->connected_at ?? now(),
            ])->save();

            return;
        }

        $integration->forceFill(['meta' => $meta])->save();
    }

    protected function kindFor(Workspace $workspace, string $instance): string
    {
        $phone = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $business = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);

        if ($phone && ($phone->meta['instance'] ?? null) === $instance) {
            return Integration::PROVIDER_WHATSAPP;
        }

        if ($business && ($business->meta['instance'] ?? null) === $instance) {
            return Integration::PROVIDER_WHATSAPP_BUSINESS;
        }

        if (str_ends_with($instance, '-wa')) {
            return Integration::PROVIDER_WHATSAPP;
        }

        return Integration::PROVIDER_WHATSAPP_BUSINESS;
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

    protected function whatsAppChannel(Workspace $workspace, bool $phone): Channel
    {
        $type = $phone ? ChannelType::WhatsApp : ChannelType::WhatsAppCloud;

        return Channel::query()->firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'type' => $type,
            ],
            [
                'name' => $phone ? 'WhatsApp' : 'WhatsApp Business',
                'status' => 'connected',
            ]
        );
    }
}
