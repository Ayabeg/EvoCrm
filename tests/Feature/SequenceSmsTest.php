<?php

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Desk\FakeSmsClient;
use App\Services\Identity\WorkspaceProvisioner;
use App\Services\Outbound\SequenceEnrollment;
use App\Services\Outbound\SuppressionService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

it('creates an SMS sequence with an Algeria-first French body', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/outbound/sequences', [
            'name' => 'Relance SMS Oran',
            'channel' => 'sms',
        ])
        ->assertRedirect();

    $sequence = Sequence::query()->where('name', 'Relance SMS Oran')->first();

    expect($sequence)->not->toBeNull()
        ->and($sequence->channel)->toBe('sms')
        ->and($sequence->steps)->toHaveCount(1)
        ->and($sequence->steps->first()->channel)->toBe('sms')
        ->and($sequence->steps->first()->body)->toContain('Salaam {{first_name}}')
        ->and($sequence->steps->first()->body)->toContain('STOP');
});

it('refuses to enroll a landline on an SMS sequence', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'sms',
        'active' => true,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'phone' => '021234567',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class);
});

it('dispatches sequence SMS through the gateway and does not stub', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    config([
        'sms.http.url' => 'https://sms.example.dz/api/send',
        'sms.http.key' => 'dz-secret',
    ]);
    $fake = app(FakeSmsClient::class);
    $fake->reset();

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'phone' => '0550188001',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'sms',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'sms',
        'body' => 'Salaam {{first_name}}, rappel demain. STOP pour opt-out.',
    ]);

    app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()
        ->where('sequence_id', $sequence->id)
        ->where('contact_id', $contact->id)
        ->firstOrFail();

    expect($message->status)->toBe('sent')
        ->and($message->channel)->toBe('sms')
        ->and($message->to_address)->toBe('+213550188001')
        ->and($message->body)->toContain('Salaam Amine')
        ->and($message->provider_event_id)->toBe('SM-fake-1')
        ->and($fake->sends)->toHaveCount(1)
        ->and($fake->sends[0]['to'])->toBe('+213550188001');
});

it('fails sequence SMS when the gateway is not connected instead of stubbing', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    config([
        'services.twilio.sid' => null,
        'services.twilio.token' => null,
        'services.twilio.from' => null,
        'sms.http.url' => null,
        'sms.http.key' => null,
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'phone' => '0660188001',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'sms',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'sms',
        'body' => 'Test',
    ]);

    app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()
        ->where('sequence_id', $sequence->id)
        ->firstOrFail();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('gateway');
});

it('skips suppressed Algerian mobiles on sequence SMS', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    config([
        'sms.http.url' => 'https://sms.example.dz/api/send',
        'sms.http.key' => 'dz-secret',
    ]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'phone' => '0770188001',
    ]);
    app(SuppressionService::class)->suppress($user->workspace, 'phone', $contact->phone_e164);

    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'sms',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'sms',
        'body' => 'Should not send',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class);
});

it('provisions an SMS desk channel for new workspaces', function () {
    $user = User::factory()->create();
    app(WorkspaceProvisioner::class)->seedDefaults($user->workspace);

    expect(Channel::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('type', ChannelType::Sms)
        ->exists())->toBeTrue();
});

it('rejects sms sequence create from a member without outbound permission', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->post('/outbound/sequences', [
            'name' => 'Blocked',
            'channel' => 'sms',
        ])
        ->assertForbidden();
});
