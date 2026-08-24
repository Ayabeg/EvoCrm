<?php

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\User;

it('lists the segments manage page with named filter counts', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'owner_id' => $user->id,
        'city' => 'Alger',
    ]);
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'owner_id' => null,
        'city' => 'Oran',
    ]);

    $this->actingAs($user)
        ->post('/crm/segments', [
            'name' => 'Alger owners',
            'entity' => 'contact',
            'filters_json' => json_encode(['city' => 'Alger']),
        ])
        ->assertRedirect('/crm/segments');

    expect(SavedFilter::query()->where('name', 'Alger owners')->exists())->toBeTrue();

    $this->actingAs($user)
        ->get('/crm/segments')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/segments/index')
            ->where('tab', 'manage')
            ->has('segments', 1)
            ->where('segments.0.name', 'Alger owners')
            ->where('segments.0.entity', 'contact')
            ->where('segments.0.count', 1)
        );
});

it('adds Segments as a new CRM nav item without reordering the rest', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain("label: 'Segments'")
        ->toContain("href: '/crm/segments'");

    expect(strpos($sidebar, "href: '/crm/companies'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/deals'"))
        ->and(strpos($sidebar, "href: '/crm/deals'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/leads'"))
        ->and(strpos($sidebar, "href: '/crm/leads'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/segments'"));
});
