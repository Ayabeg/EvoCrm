<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\OutboundMessage;
use App\Models\OutboundProviderEvent;
use App\Models\Sequence;
use App\Models\Suppression;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Support\Carbon;

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

it('records a delivery event idempotently without changing sent status', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'delivered@clinic.dz',
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'delivered@clinic.dz',
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
        'event_id' => 'evt-delivered-1',
        'message_id' => $message->id,
        'type' => 'delivered',
    ])->assertOk()->assertJson(['event_type' => 'delivered']);

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-delivered-1',
        'message_id' => $message->id,
        'type' => 'delivered',
    ])->assertOk();

    expect($message->fresh()->status)->toBe('sent')
        ->and($message->fresh()->delivered_at)->not->toBeNull()
        ->and(OutboundProviderEvent::query()->where('provider_event_id', 'evt-delivered-1')->count())->toBe(1)
        ->and(app(ProductAnalytics::class)->eventNames())->toContain(ProductAnalytics::EMAIL_DELIVERED);
});

it('suppresses and pauses a sequence enrollment on a complaint', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'complaint@clinic.dz',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);
    $enrollment = $sequence->enrollments()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now()->addDay(),
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'sequence_id' => $sequence->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'complaint@clinic.dz',
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
        'event_id' => 'evt-complaint-1',
        'message_id' => $message->id,
        'type' => 'spam_complaint',
    ])->assertOk()->assertJson(['event_type' => 'complaint']);

    expect($message->fresh()->status)->toBe('failed')
        ->and($message->fresh()->complained_at)->not->toBeNull()
        ->and($enrollment->fresh()->status)->toBe('paused')
        ->and(Suppression::query()->forWorkspace($user->workspace)->where('value', 'complaint@clinic.dz')->value('reason'))->toBe('complaint')
        ->and(OutboundProviderEvent::query()->where('provider_event_id', 'evt-complaint-1')->count())->toBe(1)
        ->and(app(ProductAnalytics::class)->eventNames())->toContain(ProductAnalytics::EMAIL_COMPLAINED);
});

it('does not send again to a hard-bounced address', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'bounce-again@clinic.dz',
    ]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'bounce-again@clinic.dz',
        'subject' => 'Follow up',
        'body' => 'Hello',
        'status' => 'sent',
        'sent_at' => now()->subDay(),
    ]);
    $endpoint = app(WebhookEndpointManager::class)->forWorkspace(
        $user->workspace,
        WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE,
    );

    $this->postJson("/webhooks/outbound/bounces/{$endpoint->key}", [
        'event_id' => 'evt-hard-suppress',
        'message_id' => $message->id,
        'type' => 'hard',
        'email' => 'bounce-again@clinic.dz',
    ])->assertOk();

    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'subject' => 'Again',
        'body' => 'Should not send',
    ]);
    $enrollment = Enrollment::query()->create([
        'workspace_id' => $user->workspace_id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now()->subMinute(),
    ]);

    $this->artisan('outbound:run')->assertSuccessful();

    expect($enrollment->refresh()->status)->toBe('cancelled')
        ->and(OutboundMessage::query()
            ->where('sequence_id', $sequence->id)
            ->count())->toBe(0);
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
