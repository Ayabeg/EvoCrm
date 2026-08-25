<?php

use App\Models\Contact;
use App\Models\OutboundMessage;
use App\Models\Suppression;
use App\Models\User;
use App\Services\Webhooks\WebhookEndpointManager;

it('records a hard bounce once and suppresses the address', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'bounce@clinic.dz',
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'bounce@clinic.dz',
        'subject' => 'Follow up',
        'body' => 'Hello',
        'status' => 'sent',
        'sent_at' => now(),
    ]);

    $endpoint = app(WebhookEndpointManager::class)->forWorkspace(
        $user->workspace,
        WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE,
    );

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-hard-1',
        'message_id' => $message->id,
        'type' => 'hard',
        'email' => 'bounce@clinic.dz',
    ])->assertOk()->assertJson(['ok' => true, 'bounce_type' => 'hard']);

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-hard-1',
        'message_id' => $message->id,
        'type' => 'hard',
        'email' => 'bounce@clinic.dz',
    ])->assertOk();

    expect(OutboundMessage::query()->where('id', $message->id)->value('status'))->toBe('bounced')
        ->and(OutboundMessage::query()->where('provider_event_id', 'evt-hard-1')->count())->toBe(1)
        ->and(Suppression::query()
            ->forWorkspace($user->workspace)
            ->where('type', 'email')
            ->where('value', 'bounce@clinic.dz')
            ->exists())->toBeTrue();
});

it('records a soft bounce without suppressing', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'soft@clinic.dz',
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'soft@clinic.dz',
        'subject' => 'Follow up',
        'body' => 'Hello',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace(
        $user->workspace,
        WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE,
    );

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-soft-1',
        'message_id' => $message->id,
        'type' => 'soft',
    ])->assertOk();

    expect($message->fresh()->bounce_type)->toBe('soft')
        ->and(Suppression::query()->forWorkspace($user->workspace)->count())->toBe(0);
});

it('rejects a bounce webhook from another workspace key', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'leak@clinic.dz',
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'leak@clinic.dz',
        'subject' => 'Follow up',
        'body' => 'Hello',
        'status' => 'sent',
    ]);
    $foreign = app(WebhookEndpointManager::class)->forWorkspace(
        $other->workspace,
        WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE,
    );

    $this->postJson("/webhooks/outbound/bounces/{$foreign->key}", [
        'event_id' => 'evt-foreign',
        'message_id' => $message->id,
        'type' => 'hard',
    ])->assertNotFound();

    expect($message->fresh()->status)->toBe('sent');
});
