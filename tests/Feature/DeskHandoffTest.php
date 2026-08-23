<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('serves My Inbox on the CRM host with the EvoDesk embed, never an eject', function () {
    Http::fake(['*' => Http::response('', 200)]);

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    // The inbox is an in-app page on the CRM host — not a redirect away.
    $response = $this->actingAs($user)->get('/inbox');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', 'https://desk.evotechly.com/')
            ->where('embedState', 'ok')
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

it('serves the native CRM desk at /inbox when the desk refuses framing', function () {
    // Chatwoot's default header blocks cross-origin embedding.
    Http::fake(['*' => Http::response('', 200, ['X-Frame-Options' => 'SAMEORIGIN'])]);

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', null)
            ->where('embedState', 'blocked')
            ->where('configuredUrl', 'https://desk.evotechly.com/')
            ->has('embedReason')
            ->has('threads')
        );
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
            ->where('embedState', 'no-url')
            ->has('threads')
        );
});

it('honors EVOSALES_INBOX_EMBED_PATH when building the embed source', function () {
    Http::fake(['*' => Http::response('', 200)]);

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
