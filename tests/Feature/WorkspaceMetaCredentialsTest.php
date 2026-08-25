<?php

use App\Models\AdAccount;
use App\Models\Contact;
use App\Models\Integration;
use App\Models\SavedFilter;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Ads\MetaAdsService;
use App\Services\Ads\MetaAudienceSyncService;
use Illuminate\Support\Facades\Http;

function connectMetaWorkspace(Workspace $workspace, string $token, string $accountId): Integration
{
    return $workspace->integrations()->create([
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => $token,
        'scopes' => ['ads_management'],
        'meta' => [
            'ad_accounts' => [
                ['id' => $accountId, 'name' => 'Workspace account'],
            ],
            'selected_ad_account_id' => $accountId,
        ],
        'connected_at' => now(),
    ]);
}

it('uses each workspace Meta token and selected ad account for campaign sync', function () {
    $first = Workspace::factory()->create();
    $second = Workspace::factory()->create();
    connectMetaWorkspace($first, 'token-first', 'act_111');
    connectMetaWorkspace($second, 'token-second', 'act_222');

    Http::fake([
        'graph.facebook.com/*/act_*/campaigns*' => Http::response(['data' => []]),
    ]);

    expect(app(MetaAdsService::class)->sync($first)['ok'])->toBeTrue()
        ->and(app(MetaAdsService::class)->sync($second)['ok'])->toBeTrue();

    Http::assertSent(fn ($request) => str_contains($request->url(), '/act_111/campaigns')
        && $request->hasHeader('Authorization', 'Bearer token-first'));
    Http::assertSent(fn ($request) => str_contains($request->url(), '/act_222/campaigns')
        && $request->hasHeader('Authorization', 'Bearer token-second'));

    expect(AdAccount::query()->where('workspace_id', $first->id)->value('external_id'))->toBe('act_111')
        ->and(AdAccount::query()->where('workspace_id', $second->id)->value('external_id'))->toBe('act_222');
});

it('uses the workspace Meta token for audience synchronization', function () {
    $workspace = Workspace::factory()->create();
    connectMetaWorkspace($workspace, 'workspace-token', 'act_333');
    Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'email' => 'person@example.test',
    ]);
    $segment = SavedFilter::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => User::factory()->create(['workspace_id' => $workspace->id])->id,
        'entity' => 'contact',
        'name' => 'Audience',
        'filters' => [],
    ]);

    Http::fake(['graph.facebook.com/*' => Http::response(['ok' => true])]);

    $result = app(MetaAudienceSyncService::class)->syncSegment($workspace, $segment, 'audience-1');

    expect($result['synced'])->toBe(1);
    Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer workspace-token'));
});

it('does not fall back to global Meta runtime credentials', function () {
    config()->set('meta.access_token', 'global-token');
    config()->set('meta.ad_account_id', 'act_global');
    $workspace = Workspace::factory()->create();

    $result = app(MetaAdsService::class)->sync($workspace);

    expect($result['ok'])->toBeFalse()
        ->and($result['reason'])->toContain('workspace');
    Http::assertNothingSent();
});

it('allows an administrator to select only a discovered workspace ad account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    connectMetaWorkspace($admin->workspace, 'token', 'act_444');

    $this->actingAs($admin)
        ->put('/settings/meta/ad-account', ['ad_account_id' => 'act_444'])
        ->assertRedirect();

    expect($admin->workspace->integration('meta')->meta['selected_ad_account_id'])->toBe('act_444');

    $this->actingAs($admin)
        ->put('/settings/meta/ad-account', ['ad_account_id' => 'act_other'])
        ->assertSessionHasErrors('ad_account_id');
});
