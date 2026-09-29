<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Support\DesignLabAccess;

it('allows design-lab in non-production environments', function () {
    expect(app()->isProduction())->toBeFalse();

    $this->get('/design-lab')->assertOk();
});

it('hides design-lab from guests and members in production', function () {
    $this->app['env'] = 'production';

    expect(app()->isProduction())->toBeTrue()
        ->and(DesignLabAccess::allowed(null))->toBeFalse();

    $this->get('/design-lab')->assertNotFound();

    $member = User::factory()->create(['role' => WorkspaceRole::Member]);

    expect(DesignLabAccess::allowed($member))->toBeFalse();

    $this->actingAs($member)->get('/design-lab')->assertNotFound();
});

it('allows workspace admins to open design-lab in production', function () {
    $this->app['env'] = 'production';

    $admin = User::factory()->create(['role' => WorkspaceRole::Admin]);

    expect(DesignLabAccess::allowed($admin))->toBeTrue();

    $this->actingAs($admin)->get('/design-lab')->assertOk();
});
