<?php

it('keeps contact, company, and deal records on the EvoCRM 3-pane contract', function () {
    $shows = [
        resource_path('js/pages/crm/contacts/show.tsx'),
        resource_path('js/pages/crm/companies/show.tsx'),
        resource_path('js/pages/crm/deals/show.tsx'),
        resource_path('js/pages/crm/leads/show.tsx'),
    ];

    foreach ($shows as $path) {
        $src = file_get_contents($path);

        expect($src)->toContain('RecordShell')
            ->and($src)->toContain('AskEvoPanel')
            ->and($src)->not->toContain('Breeze')
            ->and($src)->not->toContain('Slack');
    }

    $contact = file_get_contents(resource_path('js/pages/crm/contacts/show.tsx'));
    $lead = file_get_contents(resource_path('js/pages/crm/leads/show.tsx'));
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));
    $desk = file_get_contents(resource_path('js/components/crm/desk-thread-card.tsx'));

    expect($contact)->toContain('DeskThreadCard')
        ->and($contact)->toContain('whatsappHref')
        ->and($lead)->toContain('WhatsApp')
        ->and($lead)->toContain('AskEvoPanel')
        ->and($ask)->toContain('ask-evo-rail')
        ->and($ask)->toContain('This record')
        ->and($desk)->toContain('Continue on WhatsApp')
        ->and($desk)->toContain('No Slack');
});

it('renders the live contact record with Ask Evo payload', function () {
    $user = \App\Models\User::factory()->create();
    $contact = \App\Models\Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->has('askEvo.summary')
            ->has('timeline')
        );
});
