<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Desk\FakeSmsClient;
use App\Services\Desk\TwilioSmsClient;
use Illuminate\Support\Facades\Http;

function smsThread(User $user, ?string $phone = '0550188001'): Thread
{
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'phone' => $phone ?? '0550188001',
    ]);

    if ($phone === null) {
        $contact->forceFill(['phone' => null, 'phone_e164' => null])->saveQuietly();
    }

    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::Sms],
        ['name' => 'SMS', 'status' => 'connected']
    );

    return Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'SMS',
        'last_message_at' => now(),
    ]);
}

it('stubs an SMS reply when Twilio is not configured', function () {
    $user = User::factory()->create();
    $thread = smsThread($user);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Rappel demain'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message)->not->toBeNull()
        ->and($message->status)->toBe('sent')
        ->and($message->provider)->toBe('sms')
        ->and($message->payload['stub'] ?? false)->toBeTrue();
});

it('fails SMS when the contact has no phone number', function () {
    $user = User::factory()->create();
    $thread = smsThread($user, null);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Sans numero'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('phone');
});

it('dispatches SMS through the provider client when Twilio is configured', function () {
    config([
        'services.twilio.sid' => 'ACtest',
        'services.twilio.token' => 'secret',
        'services.twilio.from' => '+213555000000',
    ]);
    $fake = app(FakeSmsClient::class);
    $fake->reset();
    $fake->ok = true;

    $user = User::factory()->create();
    $thread = smsThread($user);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Confirmez le RDV'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message->status)->toBe('sent')
        ->and($message->provider_message_id)->toBe('SM-fake-1')
        ->and($message->failure_reason)->toBeNull()
        ->and($fake->sends)->toHaveCount(1)
        ->and($fake->sends[0]['body'])->toBe('Confirmez le RDV');
});

it('marks the desk message failed when the SMS provider rejects the send', function () {
    config([
        'services.twilio.sid' => 'ACtest',
        'services.twilio.token' => 'secret',
        'services.twilio.from' => '+213555000000',
    ]);
    $fake = app(FakeSmsClient::class);
    $fake->reset();
    $fake->ok = false;
    $fake->error = 'Unreachable number for owner@clinic.dz using Authorization: Bearer secret-value';

    $user = User::factory()->create();
    $thread = smsThread($user);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Echec'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('Unreachable number')
        ->and($message->failure_reason)->not->toContain('owner@clinic.dz')
        ->and($message->failure_reason)->not->toContain('Bearer secret-value');
});

it('fails SMS when the number is an Algerian landline', function () {
    $user = User::factory()->create();
    $thread = smsThread($user, '021234567');

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Fixe'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('Algeria-only');
});

it('fails SMS when the number is foreign', function () {
    $user = User::factory()->create();
    $thread = smsThread($user, '+33123456789');

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/reply", ['body' => 'Paris'])
        ->assertRedirect();

    $message = Message::query()->where('thread_id', $thread->id)->latest('id')->first();

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('Algeria-only');
});

it('posts configured SMS through the Twilio messages API', function () {
    config([
        'services.twilio.sid' => 'ACtest',
        'services.twilio.token' => 'secret',
        'services.twilio.from' => '+213555000000',
    ]);

    Http::fake([
        'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json' => Http::response([
            'sid' => 'SMreal',
            'status' => 'queued',
        ], 201),
    ]);

    $result = app(TwilioSmsClient::class)->sendText('+2135550188001', 'Salaam');

    expect($result['ok'])->toBeTrue()
        ->and($result['id'])->toBe('SMreal');

    Http::assertSent(fn ($request) => $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json'
        && $request['To'] === '+2135550188001'
        && $request['From'] === '+213555000000'
        && $request['Body'] === 'Salaam');
});
