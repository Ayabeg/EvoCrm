<?php

use App\Models\User;
use App\Services\Evolution\EvolutionCloudService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('scopes Evolution instance names per workspace and channel', function () {
    $workspace = User::factory()->create()->workspace;
    $service = app(EvolutionCloudService::class);

    expect($service->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP))
        ->toBe('evo-ws'.$workspace->id.'-wa')
        ->and($service->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP_BUSINESS))
        ->toBe('evo-ws'.$workspace->id.'-waba');
});
