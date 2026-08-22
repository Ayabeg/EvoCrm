<?php

use App\Models\User;

it('shares the EvoDesk URL and treats conversation history as CRM context', function () {
    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('deskUrl', 'https://desk.evotechly.com')
            ->has('stats.open_deals')
            ->has('stats.inbox_unread')
            ->has('nextSteps')
        );

    $this->actingAs($user)
        ->get('/conversations')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/conversations')
            ->where('deskUrl', 'https://desk.evotechly.com')
        );

    $this->actingAs($user)
        ->from('/settings/channels')
        ->post('/settings/channels', ['inbox_url' => 'https://desk.example.test'])
        ->assertRedirect();

    expect($user->workspace->fresh()->inbox_url)->toBe('https://desk.example.test');
});
