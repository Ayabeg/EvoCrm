<?php

namespace App\Services\Ads;

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\Workspace;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Official Meta Marketing API sync. Env-driven: when META_ACCESS_TOKEN and
 * META_AD_ACCOUNT_ID are empty the workspace runs on local demo/seed data and
 * sync() is a no-op with a clear reason. Never invent app IDs.
 */
class MetaAdsService
{
    public function configured(): bool
    {
        return filled(config('meta.access_token')) && filled(config('meta.ad_account_id'));
    }

    /**
     * @return array{ok: bool, reason: string|null, campaigns: int}
     */
    public function sync(Workspace $workspace): array
    {
        if (! $this->configured()) {
            return [
                'ok' => false,
                'reason' => 'Meta is not connected. Set META_APP_ID, META_ACCESS_TOKEN, and META_AD_ACCOUNT_ID. Demo campaigns stay local.',
                'campaigns' => 0,
            ];
        }

        $accountExternalId = (string) config('meta.ad_account_id');
        $account = AdAccount::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $accountExternalId],
            ['name' => 'Meta ad account '.$accountExternalId, 'status' => 'connected'],
        );

        if ($account->status !== 'connected') {
            $account->forceFill(['status' => 'connected'])->save();
        }

        $campaigns = $this->fetchCampaigns($accountExternalId);
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

            $this->syncInsights($workspace, $campaign);
            $synced++;
        }

        return ['ok' => true, 'reason' => null, 'campaigns' => $synced];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function fetchCampaigns(string $accountExternalId): array
    {
        $response = $this->client()->get($this->url('/act_'.ltrim($accountExternalId, 'act_').'/campaigns'), [
            'fields' => 'id,name,objective,status,daily_budget',
            'limit' => 100,
        ]);

        $response->throw();

        return $response->json('data') ?? [];
    }

    protected function syncInsights(Workspace $workspace, AdCampaign $campaign): void
    {
        if (! $campaign->external_id) {
            return;
        }

        $response = $this->client()->get($this->url('/'.$campaign->external_id.'/insights'), [
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

    protected function client(): PendingRequest
    {
        return Http::timeout(20)
            ->acceptJson()
            ->withToken($this->token());
    }

    protected function url(string $path): string
    {
        $version = (string) config('meta.graph_version', 'v21.0');

        return "https://graph.facebook.com/{$version}".'/'.ltrim($path, '/');
    }

    protected function token(): string
    {
        return (string) config('meta.access_token');
    }
}
