<?php

namespace App\Services\Ads;

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\Workspace;
use App\Services\Meta\WorkspaceMetaCredentials;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Official Meta Marketing API sync using the encrypted OAuth connection and
 * selected ad account that belong to the workspace.
 */
class MetaAdsService
{
    public function __construct(private WorkspaceMetaCredentials $credentials) {}

    public function configured(Workspace $workspace): bool
    {
        return $this->credentials->resolve($workspace)['ok'];
    }

    /**
     * @return array{ok: bool, reason: string|null, campaigns: int}
     */
    public function sync(Workspace $workspace): array
    {
        $credentials = $this->credentials->resolve($workspace);

        if (! $credentials['ok']) {
            return [
                'ok' => false,
                'reason' => $credentials['reason'],
                'campaigns' => 0,
            ];
        }

        $accountExternalId = (string) $credentials['ad_account_id'];
        $token = (string) $credentials['token'];
        $account = AdAccount::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $accountExternalId],
            ['name' => 'Meta ad account '.$accountExternalId, 'status' => 'connected'],
        );

        if ($account->status !== 'connected') {
            $account->forceFill(['status' => 'connected'])->save();
        }

        $campaigns = $this->fetchCampaigns($accountExternalId, $token);
        $synced = 0;

        foreach ($campaigns as $row) {
            $campaign = AdCampaign::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'external_id' => (string) $row['id']],
                [
                    'ad_account_id' => $account->id,
                    'name' => (string) ($row['name'] ?? 'Meta campaign'),
                    'objective' => $row['objective'] ?? null,
                    'status' => strtolower((string) ($row['status'] ?? 'active')),
                    'click_to_whatsapp' => $this->isCtwa($row),
                    'lead_form' => $this->isLeadForm($row),
                ],
            );

            $this->syncInsights($workspace, $campaign, $token);
            $synced++;
        }

        return ['ok' => true, 'reason' => null, 'campaigns' => $synced];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function fetchCampaigns(string $accountExternalId, string $token): array
    {
        $response = $this->client($token)->get($this->url('/act_'.ltrim($accountExternalId, 'act_').'/campaigns'), [
            'fields' => 'id,name,objective,status,daily_budget',
            'limit' => 100,
        ]);

        $response->throw();

        return $response->json('data') ?? [];
    }

    protected function syncInsights(Workspace $workspace, AdCampaign $campaign, string $token): void
    {
        if (! $campaign->external_id) {
            return;
        }

        $response = $this->client($token)->get($this->url('/'.$campaign->external_id.'/insights'), [
            'fields' => 'impressions,clicks,spend,date_start',
            'date_preset' => 'last_30d',
            'time_increment' => 1,
            'limit' => 90,
        ]);

        if (! $response->successful()) {
            return;
        }

        foreach ($response->json('data') ?? [] as $day) {
            AdCampaignStat::query()->updateOrCreate(
                ['ad_campaign_id' => $campaign->id, 'date' => $day['date_start']],
                [
                    'workspace_id' => $workspace->id,
                    'impressions' => (int) ($day['impressions'] ?? 0),
                    'clicks' => (int) ($day['clicks'] ?? 0),
                    'spend_cents' => (int) round(((float) ($day['spend'] ?? 0)) * 100),
                ],
            );
        }
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function isCtwa(array $row): bool
    {
        return strtoupper((string) ($row['objective'] ?? '')) === 'MESSAGES';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function isLeadForm(array $row): bool
    {
        return strtoupper((string) ($row['objective'] ?? '')) === 'LEAD_GENERATION';
    }

    protected function client(string $token): PendingRequest
    {
        return Http::timeout(20)
            ->acceptJson()
            ->withToken($token);
    }

    protected function url(string $path): string
    {
        $version = (string) config('meta.graph_version', 'v21.0');

        return "https://graph.facebook.com/{$version}".'/'.ltrim($path, '/');
    }

}
