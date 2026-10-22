<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\QuietHours;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\OutboundSendClaim;
use App\Services\Outbound\SequenceEnrollment;
use App\Services\Outbound\SuppressionService;
use Illuminate\Support\Carbon;

function makeActiveSequence(User $user, array $steps = [[0, 'Hello {{first_name}}', 'Body {{first_name}}'], [24, 'Follow-up', 'Second touch']]): Sequence
{
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);

    foreach ($steps as $index => [$delay, $subject, $body]) {
        $sequence->steps()->create([
            'position' => $index + 1,
            'delay_hours' => $delay,
            'channel' => 'email',
            'subject' => $subject,
            'body' => $body,
        ]);
    }

    return $sequence->fresh('steps');
}

it('sends the due step, renders variables, and advances the enrollment', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => true]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'email' => 'amine@example.dz',
    ]);

    $sequence = makeActiveSequence($user);
    $enrollment = app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()
        ->where('sequence_id', $sequence->id)
        ->where('contact_id', $contact->id)
        ->firstOrFail();

    expect($message->status)->toBe('sent');
    expect($message->subject)->toBe('Hello Amine');
    expect($message->body)->toBe('Body Amine');
    expect($message->direction)->toBe('out');
    expect($message->track_token)->not->toBeNull();

    $enrollment->refresh();
    expect($enrollment->next_step)->toBe(2);
    expect($enrollment->next_run_at->gt(now()->addHours(23)))->toBeTrue();
});

it('defers sends during quiet hours instead of dispatching', function () {
    $this->travelTo(Carbon::parse('2026-08-23 22:15:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    QuietHours::query()->where('workspace_id', $user->workspace_id)->update([
        'enabled' => true,
        'timezone' => 'Africa/Algiers',
        'starts_at' => '21:00',
        'ends_at' => '08:00',
    ]);

    Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => true]);

    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $sequence = makeActiveSequence($user);
    $enrollment = app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    expect(OutboundMessage::query()->where('sequence_id', $sequence->id)->count())->toBe(0);

    $enrollment->refresh();
    expect($enrollment->status)->toBe('active');
    expect($enrollment->next_run_at->format('H:i'))->toBe('08:00');
});

it('cancels the enrollment when the contact lands on the suppression list', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    Mailbox::factory()->create(['workspace_id' => $user->workspace_id, 'enabled' => true]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'blocked@example.dz',
    ]);

    $sequence = makeActiveSequence($user);
    $enrollment = app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    app(SuppressionService::class)->suppress($user->workspace, 'email', 'blocked@example.dz');

    $this->artisan('outbound:run')->assertSuccessful();

    expect(OutboundMessage::query()->where('sequence_id', $sequence->id)->count())->toBe(0);
    expect($enrollment->refresh()->status)->toBe('cancelled');
});

it('fails honestly in the outbox when no mailbox is enabled', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $sequence = makeActiveSequence($user);
    app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    $this->artisan('outbound:run')->assertSuccessful();

    $message = OutboundMessage::query()->where('sequence_id', $sequence->id)->firstOrFail();
    expect($message->status)->toBe('failed');
    expect($message->failure_reason)->toContain('No mailbox configured');
});

it('fails a direct dispatch with an invalid recipient address', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'not-an-email',
    ]);

    $message = app(OutboundDispatcher::class)->dispatch($user->workspace, $contact, [
        'channel' => 'email',
        'subject' => 'Test',
        'body' => 'Test',
    ]);

    expect($message->status)->toBe('failed')
        ->and($message->failure_reason)->toContain('invalid');
});

it('reuses an outbound message when a dispatch is retried with the same idempotency key', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $attributes = [
        'channel' => 'email',
        'subject' => 'Test',
        'body' => 'Test',
        'idempotency_key' => 'sequence:42:contact:'.$contact->id.':step:7',
    ];

    $first = app(OutboundDispatcher::class)->dispatch($user->workspace, $contact, $attributes);
    $second = app(OutboundDispatcher::class)->dispatch($user->workspace, $contact, $attributes);

    expect($second->id)->toBe($first->id)
        ->and(OutboundMessage::query()->where('idempotency_key', $attributes['idempotency_key'])->count())->toBe(1);
});

it('does not reset an active send claim during a duplicate dispatch', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Claimed',
        'body' => 'Claimed body',
        'status' => 'sending',
        'sending_at' => now(),
        'idempotency_key' => 'sequence:claim:contact:'.$contact->id,
    ]);

    $retried = app(OutboundDispatcher::class)->dispatch($user->workspace, $contact, [
        'channel' => 'email',
        'subject' => 'Claimed',
        'body' => 'Claimed body',
        'idempotency_key' => $message->idempotency_key,
    ]);

    expect($retried->id)->toBe($message->id)
        ->and($retried->fresh()->status)->toBe('sending')
        ->and($retried->fresh()->sending_at)->not->toBeNull();
});

it('recovers stale outbound send claims for a safe retry', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $message = OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Stale',
        'body' => 'Stale body',
        'status' => 'sending',
        'sending_at' => now()->subMinutes(16),
    ]);

    expect(app(OutboundSendClaim::class)->recoverStale($user->workspace))->toBe(1)
        ->and($message->fresh()->status)->toBe('queued')
        ->and($message->fresh()->sending_at)->toBeNull();
});

it('pauses and resumes enrollments from the UI', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id]);

    $enrollment = Enrollment::query()->create([
        'workspace_id' => $user->workspace_id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now(),
    ]);

    $this->actingAs($user)->post("/outbound/enrollments/{$enrollment->id}/pause")->assertRedirect();
    expect($enrollment->refresh()->status)->toBe('paused');

    $this->actingAs($user)->post("/outbound/enrollments/{$enrollment->id}/resume")->assertRedirect();
    expect($enrollment->refresh()->status)->toBe('active');

    $this->actingAs($user)->post("/outbound/enrollments/{$enrollment->id}/cancel")->assertRedirect();
    expect($enrollment->refresh()->status)->toBe('cancelled');
});
