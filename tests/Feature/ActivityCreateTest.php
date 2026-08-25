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
            'due_at' => now()->addHour()->toDateTimeString(),
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
            ->where('attention.0.key', 'tasks_due')
            ->where('attention.0.title', 'Tasks due today')
            ->missing('nextSteps')
        );

    $this->actingAs($user)
        ->get('/crm/activities?type=task')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('activities', 1));
});
