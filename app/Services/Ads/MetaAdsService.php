<?php

namespace App\Services\Ads;

use App\Models\Ad;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdSet;
use App\Models\Workspace;
use App\Services\Meta\MetaGraphClient;
use App\Services\Meta\WorkspaceMetaCredentials;
use Illuminate\Support\Carbon;
use RuntimeException;
use Throwable;

/**
 * Official Meta Marketing API sync using the encrypted OAuth connection and
 * selected ad account that belong to the workspace.
 *
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account
 */
class MetaAdsService
{
    public function __construct(
        private WorkspaceMetaCredentials $credentials,
        private MetaGraphClient $graph,
    ) {}

    public function configured(Workspace $workspace): bool
    {
        return $this->credentials->resolve($workspace)['ok'];
    }

    /**
     * @return array{ok: bool, reason: string|null, campaigns: int, ad_sets: int, ads: int}
     */
    public function sync(Workspace $workspace): array
    {
        $credentials = $this->credentials->resolve($workspace);

        if (! $credentials['ok']) {
            return [
                'ok' => false,
                'reason' => $credentials['reason'],
                'campaigns' => 0,
                'ad_sets' => 0,
                'ads' => 0,
            ];
        }

        $accountExternalId = (string) $credentials['ad_account_id'];
        $token = (string) $credentials['token'];

        try {
            $account = $this->syncAccount($workspace, $accountExternalId, $token);
            $campaigns = $this->syncCampaigns($workspace, $account, $token);
            $adSets = $this->syncAdSets($workspace, $account, $campaigns, $token);
            $ads = $this->syncAds($workspace, $account, $adSets, $campaigns, $token);

            return [
                'ok' => true,
                'reason' => null,
                'campaigns' => count($campaigns),
                'ad_sets' => count($adSets),
                'ads' => count($ads),
            ];
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === MetaGraphClient::TOKEN_EXPIRED) {
                $credentials['integration']?->forceFill(['status' => 'expired'])->save();

                return [
                    'ok' => false,
                    'reason' => 'The workspace Meta token has expired. Reconnect Meta.',
                    'campaigns' => 0,
                    'ad_sets' => 0,
                    'ads' => 0,
                ];
            }

            throw $exception;
        }
    }

    /**
     * @return array<string, AdCampaign>
     */
    protected function syncCampaigns(Workspace $workspace, AdAccount $account, string $token): array
    {
        $rows = $this->graph->paginate($token, '/act_'.ltrim((string) $account->external_id, 'act_').'/campaigns', [
            'fields' => 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time',
            'limit' => 100,
        ]);

        $synced = [];

        foreach ($rows as $row) {
            $campaign = AdCampaign::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'external_id' => (string) $row['id']],
                [
                    'ad_account_id' => $account->id,
                    'name' => (string) ($row['name'] ?? 'Meta campaign'),
                    'objective' => $row['objective'] ?? null,
                    'status' => strtolower((string) ($row['effective_status'] ?? $row['status'] ?? 'active')),
                    'daily_budget_cents' => $this->budgetCents($row['daily_budget'] ?? null),
                    'lifetime_budget_cents' => $this->budgetCents($row['lifetime_budget'] ?? null) ?: null,
                    'starts_at' => $this->timestamp($row['start_time'] ?? null),
                    'ends_at' => $this->timestamp($row['stop_time'] ?? null),
                    'click_to_whatsapp' => $this->isCtwa($row),
                    'lead_form' => $this->isLeadForm($row),
                ],
            );

            $this->syncInsights($workspace, $campaign, $token);
            $synced[(string) $row['id']] = $campaign;
        }

        return $synced;
    }

    /**
     * @param  array<string, AdCampaign>  $campaigns
     * @return array<string, AdSet>
     */
    protected function syncAdSets(Workspace $workspace, AdAccount $account, array $campaigns, string $token): array
    {
        try {
            $rows = $this->graph->paginate($token, '/act_'.ltrim((string) $account->external_id, 'act_').'/adsets', [
                'fields' => 'id,name,status,effective_status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting',
                'limit' => 100,
            ]);
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === MetaGraphClient::TOKEN_EXPIRED) {
                throw $exception;
            }

            return [];
        } catch (Throwable) {
            return [];
        }

        $synced = [];

        foreach ($rows as $row) {
            $campaign = $campaigns[(string) ($row['campaign_id'] ?? '')] ?? null;

            if ($campaign === null) {
                continue;
            }

            $adSet = AdSet::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'external_id' => (string) $row['id']],
                [
                    'ad_campaign_id' => $campaign->id,
                    'name' => (string) ($row['name'] ?? 'Meta ad set'),
                    'status' => strtolower((string) ($row['effective_status'] ?? $row['status'] ?? 'active')),
                    'daily_budget_cents' => $this->budgetCents($row['daily_budget'] ?? null),
                    'lifetime_budget_cents' => $this->budgetCents($row['lifetime_budget'] ?? null) ?: null,
                    'optimization_goal' => $row['optimization_goal'] ?? null,
                    'targeting_summary' => $this->targetingSummary($row['targeting'] ?? null),
                ],
            );

            $synced[(string) $row['id']] = $adSet;
        }

        return $synced;
    }

    /**
     * @param  array<string, AdSet>  $adSets
     * @param  array<string, AdCampaign>  $campaigns
     * @return array<string, Ad>
     */
    protected function syncAds(Workspace $workspace, AdAccount $account, array $adSets, array $campaigns, string $token): array
    {
        try {
            $rows = $this->graph->paginate($token, '/act_'.ltrim((string) $account->external_id, 'act_').'/ads', [
                'fields' => 'id,name,status,effective_status,adset_id,campaign_id,creative{id,name,title}',
                'limit' => 100,
            ]);
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === MetaGraphClient::TOKEN_EXPIRED) {
                throw $exception;
            }

            return [];
        } catch (Throwable) {
            return [];
        }

        $synced = [];

        foreach ($rows as $row) {
            $adSet = $adSets[(string) ($row['adset_id'] ?? '')] ?? null;

            if ($adSet === null) {
                continue;
            }

            $campaign = $campaigns[(string) ($row['campaign_id'] ?? '')] ?? $adSet->campaign;
            $creative = is_array($row['creative'] ?? null) ? $row['creative'] : [];

            $ad = Ad::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'external_id' => (string) $row['id']],
                [
                    'ad_set_id' => $adSet->id,
                    'ad_campaign_id' => $campaign?->id,
                    'name' => (string) ($row['name'] ?? 'Meta ad'),
                    'status' => strtolower((string) ($row['effective_status'] ?? $row['status'] ?? 'active')),
                    'kind' => (string) ($creative['title'] ?? $creative['name'] ?? 'image'),
                    'creative_id' => isset($creative['id']) ? (string) $creative['id'] : null,
                    'creative_name' => isset($creative['name']) ? (string) $creative['name'] : null,
                ],
            );

            $synced[(string) $row['id']] = $ad;
        }

        return $synced;
    }

    protected function syncAccount(Workspace $workspace, string $accountExternalId, string $token): AdAccount
    {
        $details = [];

        try {
            $details = $this->graph->get($token, '/act_'.ltrim($accountExternalId, 'act_'), [
                'fields' => 'id,name,currency,timezone_name,account_status',
            ]);
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === MetaGraphClient::TOKEN_EXPIRED) {
                throw $exception;
            }

            $details = [];
        } catch (Throwable) {
            $details = [];
        }

        $status = match ((int) ($details['account_status'] ?? 1)) {
            1 => 'connected',
            2 => 'disabled',
            3 => 'unsettled',
            default => 'connected',
        };

        return AdAccount::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'external_id' => $accountExternalId],
            [
                'name' => (string) ($details['name'] ?? 'Meta ad account '.$accountExternalId),
                'status' => $status,
                'currency' => (string) ($details['currency'] ?? 'DZD'),
                'timezone' => $details['timezone_name'] ?? null,
            ],
        );
    }

    protected function syncInsights(Workspace $workspace, AdCampaign $campaign, string $token): void
    {
        if (! $campaign->external_id) {
            return;
        }

        try {
            $rows = $this->graph->paginate($token, '/'.$campaign->external_id.'/insights', [
                'fields' => 'impressions,clicks,reach,spend,date_start',
                'date_preset' => 'last_30d',
                'time_increment' => 1,
                'limit' => 90,
            ]);
        } catch (Throwable) {
            return;
        }

        foreach ($rows as $day) {
            if (! isset($day['date_start'])) {
                continue;
            }

            AdCampaignStat::query()->updateOrCreate(
                ['ad_campaign_id' => $campaign->id, 'date' => $day['date_start']],
                [
                    'workspace_id' => $workspace->id,
                    'impressions' => (int) ($day['impressions'] ?? 0),
                    'clicks' => (int) ($day['clicks'] ?? 0),
                    'reach' => (int) ($day['reach'] ?? 0),
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

    protected function budgetCents(mixed $value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        return (int) $value;
    }

    protected function timestamp(mixed $value): ?Carbon
    {
        if (! filled($value)) {
            return null;
        }

        return Carbon::parse((string) $value);
    }

    protected function targetingSummary(mixed $targeting): ?string
    {
        if (! is_array($targeting)) {
            return null;
        }

        $parts = [];

        if (isset($targeting['geo_locations']['countries']) && is_array($targeting['geo_locations']['countries'])) {
            $parts[] = 'countries: '.implode(',', $targeting['geo_locations']['countries']);
        }

        if (isset($targeting['age_min']) || isset($targeting['age_max'])) {
            $parts[] = 'age '.$targeting['age_min'].'-'.$targeting['age_max'];
        }

        if (isset($targeting['genders']) && is_array($targeting['genders'])) {
            $parts[] = 'genders: '.implode(',', $targeting['genders']);
        }

        $summary = implode('; ', $parts);

        return $summary !== '' ? mb_substr($summary, 0, 255) : null;
    }
}
