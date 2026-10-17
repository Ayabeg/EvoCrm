<?php

use App\Models\Contact;
use App\Models\SupportQueue;
use App\Models\Ticket;
use App\Models\User;

it('lets support managers create and maintain workspace queues', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.support-queues'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/support-queues')
            ->has('queues', 0)
            ->where('canManage', true));

    $this->actingAs($user)
        ->post(route('settings.support-queues.store'), [
            'name' => 'Customer Support',
            'round_robin' => '1',
        ])
        ->assertRedirect();

    $queue = SupportQueue::query()->firstOrFail();

    expect($queue->slug)->toBe('customer-support')
        ->and($queue->round_robin)->toBeTrue();

    $this->actingAs($user)
        ->patch(route('settings.support-queues.update', $queue), [
            'name' => 'Support DZ',
            'round_robin' => '0',
        ])
        ->assertRedirect();

    expect($queue->fresh()->name)->toBe('Support DZ')
        ->and($queue->fresh()->round_robin)->toBeFalse();
});

it('round-robins new tickets across workspace members', function () {
    $owner = User::factory()->create();
    $second = User::factory()->create(['workspace_id' => $owner->workspace_id]);
    $contact = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $queue = SupportQueue::query()->create([
        'workspace_id' => $owner->workspace_id,
        'name' => 'Support',
        'slug' => 'support',
        'round_robin' => true,
    ]);

    $this->actingAs($owner)
        ->post('/crm/tickets', [
            'subject' => 'First request',
            'contact_id' => $contact->id,
            'queue_id' => $queue->id,
        ])
        ->assertRedirect('/crm/tickets');

    $this->actingAs($owner)
        ->post('/crm/tickets', [
            'subject' => 'Second request',
            'contact_id' => $contact->id,
            'queue_id' => $queue->id,
        ])
        ->assertRedirect('/crm/tickets');

    $tickets = Ticket::query()->orderBy('id')->get();
    $expectedOwners = collect([$owner->id, $second->id])->sort()->values()->all();

    expect($tickets)->toHaveCount(2)
        ->and($tickets->pluck('queue_id')->unique()->all())->toBe([$queue->id])
        ->and($tickets->pluck('owner_id')->all())->toBe($expectedOwners);
});

it('does not allow assigning a queue from another workspace', function () {
    $user = User::factory()->create();
    $foreign = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $queue = SupportQueue::query()->create([
        'workspace_id' => $foreign->workspace_id,
        'name' => 'Foreign support',
        'slug' => 'foreign-support',
    ]);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Should not route',
            'contact_id' => $contact->id,
            'queue_id' => $queue->id,
        ])
        ->assertNotFound();
});
