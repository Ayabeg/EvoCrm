<?php

use App\Models\CustomAttributeDefinition;
use App\Models\Deal;
use App\Models\SavedReport;
use App\Models\User;
use App\Services\Crm\CustomAttributes;
use App\Services\Crm\ReportBuilder;

it('evaluates calculated custom properties from deal amount', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $deal = Deal::factory()->create([
        'workspace_id' => $workspace->id,
        'amount_cents' => 1_000_000,
    ]);

    CustomAttributeDefinition::query()->create([
        'workspace_id' => $workspace->id,
        'entity' => 'deal',
        'key' => 'tva_estimate',
        'label' => 'TVA estimate',
        'type' => 'calculated',
        'formula' => ['expression' => '{deal.amount} * 0.19'],
    ]);

    $values = app(CustomAttributes::class)->valuesFor($workspace, 'deal', $deal->id);

    expect($values['tva_estimate'])->toBe('1900');
});

it('runs a saved report with count metric', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    Deal::factory()->count(3)->create(['workspace_id' => $workspace->id]);

    $report = SavedReport::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'name' => 'All deals',
        'entity' => 'deal',
        'metric' => 'count',
        'filters' => [],
    ]);

    $result = app(ReportBuilder::class)->run($report);

    expect($result['value'])->toBe(3);
});
