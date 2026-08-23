<?php

use App\Models\User;

it('serves My Inbox on the CRM host with the EvoDesk embed, never an eject', function () {
    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    // The inbox is an in-app page on the CRM host — not a redirect away.
    $response = $this->actingAs($user)->get('/inbox');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', 'https://desk.evotechly.com/')
            ->has('threads')
        );

    expect($response->headers->get('Location'))->toBeNull();

    // Legacy /desk path lands on the in-app inbox.
    $this->actingAs($user)->get('/desk')->assertRedirect('/inbox');

    // Conversation history stays in CRM and no longer hands off a desk URL.
    $this->actingAs($user)
        ->get('/conversations')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/conversations')
            ->missing('deskUrl')
        );

    // Channels settings still configure the embed source.
    $this->actingAs($user)
        ->from('/settings/channels')
        ->post('/settings/channels', ['inbox_url' => 'https://desk.example.test'])
        ->assertRedirect();

    expect($user->workspace->fresh()->inbox_url)->toBe('https://desk.example.test');
});

it('falls back to the native CRM desk at /inbox when no desk URL is set', function () {
    config()->set('evosales.inbox_url', '');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', null)
            ->has('threads')
        );
});

it('honors EVOSALES_INBOX_EMBED_PATH when building the embed source', function () {
    config()->set('evosales.inbox_embed_path', '/app');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('embedUrl', 'https://desk.evotechly.com/app')
        );
});
