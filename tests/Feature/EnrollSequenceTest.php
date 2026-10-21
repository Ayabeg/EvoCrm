<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\User;
use App\Services\Outbound\SequenceEnrollment;
use App\Services\Outbound\SuppressionService;
use Illuminate\Validation\ValidationException;

it('enrolls a contact on a sequence', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id, 'channel' => 'email']);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/enroll", [
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    expect(Enrollment::query()->where('sequence_id', $sequence->id)->where('contact_id', $contact->id)->exists())->toBeTrue();
});

it('refuses to enroll a suppressed contact', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'blocked@evotechly.dz',
    ]);
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id]);

    app(SuppressionService::class)->suppress($user->workspace, 'email', 'blocked@evotechly.dz');

    $this->actingAs($user)
        ->from("/outbound/sequences/{$sequence->id}")
        ->post("/outbound/sequences/{$sequence->id}/enroll", [
            'contact_id' => $contact->id,
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('contact_id');
});

it('refuses to enroll an email sequence without a usable business email', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'not-an-email',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class, 'invalid business email');
});

it('refuses to enroll a contact with a catch-all verification result by default', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'catch-all@clinic.dz',
        'meta' => ['email_verification' => ['status' => 'catch_all']],
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact))
        ->toThrow(ValidationException::class, 'catch-all');
});

it('refuses a second active sequence on the same channel', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $first = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);
    $second = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    app(SequenceEnrollment::class)->enroll($user->workspace, $first, $contact);

    expect(fn () => app(SequenceEnrollment::class)->enroll($user->workspace, $second, $contact))
        ->toThrow(ValidationException::class, 'another sequence');
});
