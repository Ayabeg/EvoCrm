<?php

use App\Models\Sequence;
use App\Models\SequenceStep;
use App\Models\User;

it('reorders sequence steps for the owning workspace', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    $first = SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'First',
    ]);
    $second = SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 2,
        'delay_hours' => 24,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Second',
    ]);
    $third = SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 3,
        'delay_hours' => 48,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Third',
    ]);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/steps/reorder", [
            'order' => [$third->id, $first->id, $second->id],
        ])
        ->assertRedirect();

    expect($third->fresh()->position)->toBe(1)
        ->and($first->fresh()->position)->toBe(2)
        ->and($second->fresh()->position)->toBe(3);
});

it('rejects reordering steps that do not belong to the sequence', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create(['workspace_id' => $user->workspace_id]);
    $other = Sequence::factory()->create(['workspace_id' => $user->workspace_id]);

    $owned = SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Owned',
    ]);
    $foreign = SequenceStep::query()->create([
        'sequence_id' => $other->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Foreign',
    ]);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/steps/reorder", [
            'order' => [$foreign->id, $owned->id],
        ])
        ->assertNotFound();
});

it('rejects reordering a sequence from another workspace', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();
    $sequence = Sequence::factory()->create(['workspace_id' => $stranger->workspace_id]);
    $step = SequenceStep::query()->create([
        'sequence_id' => $sequence->id,
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'step_type' => 'email',
        'subject' => 'Hidden',
    ]);

    $this->actingAs($user)
        ->post("/outbound/sequences/{$sequence->id}/steps/reorder", [
            'order' => [$step->id],
        ])
        ->assertNotFound();
});
