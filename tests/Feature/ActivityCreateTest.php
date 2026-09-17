<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;

it('creates a task on a contact timeline and reflects it in activities and home KPIs', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/activities', [
            'type' => 'task',
            'subject' => 'Call Amine',
            'body' => 'Before 17h',
            // Home KPIs use Africa/Algiers day bounds. `now()->addHour()`
            // crosses midnight there after ~22:00 UTC and drops tasks_due.
            'due_at' => now('Africa/Algiers')->setTime(12, 0)->toDateTimeString(),
            'contact_id' => $contact->id,
            'owner_id' => $user->id,
        ])
        ->assertRedirect();

    $task = Activity::query()->where('subject', 'Call Amine')->first();

    expect($task)->not->toBeNull()
        ->and($task->type)->toBe('task')
        ->and($task->done)->toBeFalse()
        ->and($contact->fresh()->last_activity_at)->not->toBeNull();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('work.items.0.subject', 'Call Amine')
            ->missing('nextSteps')
        );

    $this->actingAs($user)
        ->get('/crm/activities?type=task')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('activities', 1));
});
