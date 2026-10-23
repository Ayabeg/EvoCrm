<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\SequenceStep;
use App\Models\User;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Support\Facades\Artisan;

it('assigns A/B variant at enrollment when steps have variant keys', function () {
    $user = User::factory()->create();
    $sequence = Sequence::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'A/B nurture',
        'channel' => 'email',
        'active' => true,
    ]);

    SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Variant A',
        'body' => 'Hello A',
        'variant_key' => 'a',
    ]);

    SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Variant B',
        'body' => 'Hello B',
        'variant_key' => 'b',
    ]);

    $contact = Contact::factory()->withVerifiedEmail()->create(['workspace_id' => $user->workspace_id]);

    $enrollment = app(SequenceEnrollment::class)->enroll($user->workspace, $sequence, $contact);

    expect($enrollment->variant_key)->toBeIn(['a', 'b'])
        ->and($enrollment->next_step)->toBe(1);
});

it('creates call activity for call sequence steps', function () {
    $user = User::factory()->create();
    $sequence = Sequence::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Call cadence',
        'channel' => 'email',
        'active' => true,
    ]);

    SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'call',
        'subject' => 'First call',
        'body' => 'Dial the contact',
    ]);

    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Enrollment::query()->create([
        'workspace_id' => $user->workspace_id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now()->subMinute(),
    ]);

    Artisan::call('outbound:run');

    expect(Activity::query()->where('contact_id', $contact->id)->where('type', 'call')->exists())->toBeTrue();
});
