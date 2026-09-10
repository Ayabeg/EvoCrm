<?php

use App\Models\MetaConversionConfig;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Identity\WorkspaceProvisioner;

it('seeds the four Conversions API maps enabled on a new workspace', function () {
    $workspace = Workspace::factory()->create();

    $rows = MetaConversionConfig::query()
        ->forWorkspace($workspace)
        ->orderBy('id')
        ->get()
        ->map(fn (MetaConversionConfig $row) => [
            $row->crm_event,
            $row->meta_event,
            $row->enabled,
        ])
        ->all();

    expect($rows)->toBe([
        [MetaConversionConfig::CRM_LEAD_CREATED, MetaConversionConfig::META_LEAD, true],
        [MetaConversionConfig::CRM_LEAD_QUALIFIED, MetaConversionConfig::META_QUALIFIED_LEAD, true],
        [MetaConversionConfig::CRM_DEAL_CREATED, MetaConversionConfig::META_SUBMIT_APPLICATION, true],
        [MetaConversionConfig::CRM_DEAL_WON, MetaConversionConfig::META_PURCHASE, true],
    ]);
});

it('does not flip a seller who turned a map off', function () {
    $workspace = Workspace::factory()->create();
    $lead = MetaConversionConfig::query()
        ->forWorkspace($workspace)
        ->where('crm_event', MetaConversionConfig::CRM_LEAD_CREATED)
        ->firstOrFail();

    $lead->forceFill(['enabled' => false, 'meta_event' => MetaConversionConfig::META_CONTACT])->save();

    app(WorkspaceProvisioner::class)->seedDefaults($workspace);

    expect($lead->fresh()->enabled)->toBeFalse()
        ->and($lead->fresh()->meta_event)->toBe(MetaConversionConfig::META_CONTACT)
        ->and(MetaConversionConfig::query()->forWorkspace($workspace)->count())->toBe(4);
});

it('renders the seeded maps on in Settings → Meta', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/meta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/meta')
            ->has('conversion_configs', 4)
            ->where('conversion_configs.0.crm_event', MetaConversionConfig::CRM_LEAD_CREATED)
            ->where('conversion_configs.0.meta_event', MetaConversionConfig::META_LEAD)
            ->where('conversion_configs.0.enabled', true)
            ->where('conversion_configs.1.crm_event', MetaConversionConfig::CRM_LEAD_QUALIFIED)
            ->where('conversion_configs.1.enabled', true)
            ->where('conversion_configs.2.crm_event', MetaConversionConfig::CRM_DEAL_CREATED)
            ->where('conversion_configs.2.meta_event', MetaConversionConfig::META_SUBMIT_APPLICATION)
            ->where('conversion_configs.3.crm_event', MetaConversionConfig::CRM_DEAL_WON)
            ->where('conversion_configs.3.meta_event', MetaConversionConfig::META_PURCHASE)
            ->where('conversion_configs.3.enabled', true));
});
