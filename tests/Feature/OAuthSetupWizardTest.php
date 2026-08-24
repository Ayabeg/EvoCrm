<?php

use App\Models\User;

it('renders the meta oauth setup wizard with stepper steps', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/meta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/setup/wizard')
            ->where('provider', 'meta')
            ->where('currentStep', 'select_app')
            ->has('steps', 3)
            ->has('troubleshooting')
        );
});

it('advances to the connect step via query param', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/meta?step=connect')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('currentStep', 'connect')
            ->where('stepIndex', 1)
        );
});

it('returns 404 for unknown setup providers', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/unknown-provider')
        ->assertNotFound();
});
