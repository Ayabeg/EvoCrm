<?php

use App\Models\ConversionFunnel;
use App\Models\ConversionFunnelStage;
use App\Models\User;
use App\Services\Funnels\ConversionFunnelProvisioner;

it('provisions the default conversion funnel with four stages', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $funnel = app(ConversionFunnelProvisioner::class)->provision($workspace);

    expect($funnel)->toBeInstanceOf(ConversionFunnel::class)
        ->and($funnel->is_default)->toBeTrue()
        ->and($funnel->slug)->toBe('sales-conversion');

    $stages = ConversionFunnelStage::query()
        ->where('conversion_funnel_id', $funnel->id)
        ->orderBy('position')
        ->pluck('key')
        ->all();

    expect($stages)->toBe(['visits', 'orders_placed', 'confirmed', 'delivered']);
});

it('does not duplicate the default funnel on re-provision', function () {
    $user = User::factory()->create();
    $provisioner = app(ConversionFunnelProvisioner::class);

    $first = $provisioner->provision($user->workspace);
    $second = $provisioner->provision($user->workspace);

    expect($first->id)->toBe($second->id)
        ->and(ConversionFunnel::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1);
});

it('creates a default funnel when a workspace is provisioned', function () {
    $user = User::factory()->create();

    expect(
        ConversionFunnel::query()
            ->forWorkspace($user->workspace)
            ->where('is_default', true)
            ->exists()
    )->toBeTrue();
});
