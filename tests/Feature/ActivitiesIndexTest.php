<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;

it('lists activities with type and owner filters', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'task',
        'subject' => 'Call back',
        'due_at' => now()->addHours(2),
        'done' => false,
        'owner_id' => $user->id,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'note',
        'subject' => 'Note',
        'done' => false,
        'contact_id' => $contact->id,
    ]);

    $this->actingAs($user)
        ->get('/crm/activities')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/activities/index')
            ->has('activities', 2));

    $this->actingAs($user)
        ->get('/crm/activities?type=task')
        ->assertInertia(fn ($page) => $page->has('activities', 1));
});
