<?php

namespace App\Services\Funnels;

use App\Models\ConversionFunnel;
use App\Models\Workspace;

/**
 * Seeds the workspace default conversion funnel: Visits → Orders placed →
 * Confirmed → Delivered. Stage matchers are resolved at query time by
 * ConversionFunnelQuery; event rows are written by FunnelEventRecorder.
 */
class ConversionFunnelProvisioner
{
    public function provision(Workspace $workspace): ConversionFunnel
    {
        $existing = ConversionFunnel::query()
            ->forWorkspace($workspace)
            ->where('is_default', true)
            ->first();

        if ($existing) {
            return $existing;
        }

        $funnel = ConversionFunnel::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Sales conversion',
            'slug' => 'sales-conversion',
            'is_default' => true,
            'config' => [
                'timezone' => config('evosales.timezone', 'Africa/Algiers'),
            ],
        ]);

        foreach (config('evosales.conversion_funnel.stages', []) as $stage) {
            $funnel->stages()->create([
                'workspace_id' => $workspace->id,
                'key' => $stage['key'],
                'label' => $stage['label'],
                'position' => $stage['position'],
                'matcher_type' => $stage['matcher_type'],
                'matcher_config' => $stage['matcher_config'] ?? null,
            ]);
        }

        return $funnel->load('stages');
    }
}
