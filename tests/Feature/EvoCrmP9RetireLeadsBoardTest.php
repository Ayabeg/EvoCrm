<?php

use App\Models\User;

it('redirects the legacy /leads board to the deals pipeline board', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));
});

it('does not advertise a second Lead board product in the rail', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("href: '/crm/leads'")
        ->and($rail)->toContain("label: 'Leads'")
        ->and($rail)->not->toContain("href: '/leads'")
        ->and($rail)->not->toContain('Lead board');
});
