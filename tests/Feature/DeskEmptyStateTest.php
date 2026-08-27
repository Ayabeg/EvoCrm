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

it('composes desk and connectors empty states as icon, short copy, and one brand CTA', function () {
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $conversations = file_get_contents(resource_path('js/pages/crm/conversations.tsx'));
    $connectors = file_get_contents(resource_path('js/pages/settings/connectors.tsx'));
    $empty = file_get_contents(resource_path('js/components/ui/empty-state.tsx'));

    expect($empty)->toContain('aurora/empty-state');

    expect($inbox)
        ->toContain('EmptyState')
        ->toContain('Connect WhatsApp Cloud')
        ->toContain('No conversations')
        ->toContain('No Baileys')
        ->not->toContain('/outbound/replies')
        ->not->toContain('WHATSAPP-BAILEYS')
        ->not->toContain('connectWithQr');

    expect($conversations)
        ->toContain('EmptyState')
        ->toContain('No conversation history')
        ->toContain('Open inbox');

    expect($connectors)
        ->toContain('EmptyState')
        ->toContain('Google is not configured')
        ->toContain('No Baileys')
        ->not->toContain('WHATSAPP-BAILEYS');
});
