<?php

use App\Models\User;

it('shows the connect-channels empty state when desk has no conversations', function () {
    config()->set('evosales.inbox_url', '');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);

    $this->actingAs($user)
        ->get('/inbox')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->has('threads', 0)
            ->has('channels', 3)
            ->where('channels.0.key', 'whatsapp_cloud')
            ->where('channels.1.key', 'instagram')
            ->where('channels.2.key', 'facebook')
            ->missing('baileys')
        );
});
