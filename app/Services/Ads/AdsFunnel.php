<?php

namespace App\Services\Ads;

use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdLead;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Thread;
use App\Models\Workspace;
use Illuminate\Support\Collection;

/**
 * Per-campaign funnel: Impressions → Clicks → Conversations / Leads →
 * Qualified → Deals → Won.
 *
 * Top-of-funnel (impressions / clicks / spend) comes from ad_campaign_stats
 * — Meta Marketing API insights when META_* is set, demo seed rows otherwise.
 * Bottom-of-funnel is CRM truth: CTWA threads, lead-form AdLeads, qualified
 * leads, deals, and won stages attributed via ad_campaign_id.
 */
class AdsFunnel
{
    /**
     * @return array{impressions: int, clicks: int, spend_cents: int, conversations: int, form_leads: int, qualified: int, deals: int, won: int}
     */
    public function forCampaign(AdCampaign $campaign): array
    {
        $stats = AdCampaignStat::query()
            ->where('ad_campaign_id', $campaign->id)
            ->selectRaw('COALESCE(SUM(impressions), 0) as impressions, COALESCE(SUM(clicks), 0) as clicks, COALESCE(SUM(spend_cents), 0) as spend_cents')
            ->first();

        $leadIds = Lead::query()->where('ad_campaign_id', $campaign->id)->select('id');

        return [
            'impressions' => (int) $stats->impressions,
            'clicks' => (int) $stats->clicks,
            'spend_cents' => (int) $stats->spend_cents,
            'conversations' => Thread::query()->where('ad_campaign_id', $campaign->id)->count(),
            'form_leads' => AdLead::query()->where('ad_campaign_id', $campaign->id)->count(),
            'qualified' => Lead::query()
                ->where('ad_campaign_id', $campaign->id)
                ->where(fn ($q) => $q->where('status', 'qualified')->orWhereNotNull('qualified_at'))
                ->count(),
            'deals' => Deal::query()->whereIn('lead_id', $leadIds)->count(),
            'won' => Deal::query()
                ->whereIn('lead_id', $leadIds)
                ->whereHas('stage', fn ($q) => $q->where('is_won', true))
                ->count(),
        ];
    }

    /**
     * Funnels for every campaign in the workspace, keyed by campaign id.
     *
     * @return Collection<int, array<string, int>>
     */
    public function forWorkspace(Workspace $workspace): Collection
    {
        return AdCampaign::query()
            ->forWorkspace($workspace)
            ->get()
            ->mapWithKeys(fn (AdCampaign $campaign) => [$campaign->id => $this->forCampaign($campaign)]);
    }

    /**
     * Workspace-level totals for the KPI strip.
     *
     * @param  Collection<int, array<string, int>>  $funnels
     * @return array{impressions: int, clicks: int, spend_cents: int, conversations: int, form_leads: int, qualified: int, deals: int, won: int}
     */
    public function totals(Collection $funnels): array
    {
        $totals = ['impressions' => 0, 'clicks' => 0, 'spend_cents' => 0, 'conversations' => 0, 'form_leads' => 0, 'qualified' => 0, 'deals' => 0, 'won' => 0];

        foreach ($funnels as $funnel) {
            foreach ($totals as $key => $value) {
                $totals[$key] = $value + ($funnel[$key] ?? 0);
            }
        }

        return $totals;
    }
}
