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
     * @return array{
     *     impressions: int,
     *     clicks: int,
     *     reach: int,
     *     spend_cents: int,
     *     conversations: int,
     *     form_leads: int,
     *     qualified: int,
     *     deals: int,
     *     won: int,
     *     revenue_cents: int,
     *     ctr: float|null,
     *     cpc_cents: int|null,
     *     cpm_cents: int|null,
     *     cpl_cents: int|null,
     *     cpql_cents: int|null,
     *     cac_cents: int|null,
     *     roas: float|null,
     *     revenue_per_lead_cents: int|null
     * }
     */
    public function forCampaign(AdCampaign $campaign): array
    {
        $stats = AdCampaignStat::query()
            ->where('ad_campaign_id', $campaign->id)
            ->selectRaw('COALESCE(SUM(impressions), 0) as impressions, COALESCE(SUM(clicks), 0) as clicks, COALESCE(SUM(reach), 0) as reach, COALESCE(SUM(spend_cents), 0) as spend_cents')
            ->first();

        $leadIds = Lead::query()->where('ad_campaign_id', $campaign->id)->select('id');
        $impressions = (int) $stats->impressions;
        $clicks = (int) $stats->clicks;
        $spend = (int) $stats->spend_cents;
        $formLeads = AdLead::query()->where('ad_campaign_id', $campaign->id)->count();
        $qualified = Lead::query()
            ->where('ad_campaign_id', $campaign->id)
            ->where(fn ($q) => $q->where('status', 'qualified')->orWhereNotNull('qualified_at'))
            ->count();
        $won = Deal::query()
            ->whereIn('lead_id', $leadIds)
            ->whereHas('stage', fn ($q) => $q->where('is_won', true))
            ->count();
        $revenue = (int) Deal::query()
            ->whereIn('lead_id', $leadIds)
            ->whereHas('stage', fn ($q) => $q->where('is_won', true))
            ->sum('amount_cents');

        return [
            'impressions' => $impressions,
            'clicks' => $clicks,
            'reach' => (int) $stats->reach,
            'spend_cents' => $spend,
            'conversations' => Thread::query()->where('ad_campaign_id', $campaign->id)->count(),
            'form_leads' => $formLeads,
            'qualified' => $qualified,
            'deals' => Deal::query()->whereIn('lead_id', $leadIds)->count(),
            'won' => $won,
            'revenue_cents' => $revenue,
            'ctr' => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : null,
            'cpc_cents' => $clicks > 0 ? (int) round($spend / $clicks) : null,
            'cpm_cents' => $impressions > 0 ? (int) round(($spend / $impressions) * 1000) : null,
            'cpl_cents' => $formLeads > 0 ? (int) round($spend / $formLeads) : null,
            'cpql_cents' => $qualified > 0 ? (int) round($spend / $qualified) : null,
            'cac_cents' => $won > 0 ? (int) round($spend / $won) : null,
            'roas' => $spend > 0 ? round($revenue / $spend, 2) : null,
            'revenue_per_lead_cents' => $formLeads > 0 ? (int) round($revenue / $formLeads) : null,
        ];
    }

    /**
     * Funnels for every campaign in the workspace, keyed by campaign id.
     *
     * @return Collection<int, array<string, int|float|null>>
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
     * @return array<string, int|float|null>
     */
    public function totals(Collection $funnels): array
    {
        $totals = [
            'impressions' => 0,
            'clicks' => 0,
            'reach' => 0,
            'spend_cents' => 0,
            'conversations' => 0,
            'form_leads' => 0,
            'qualified' => 0,
            'deals' => 0,
            'won' => 0,
            'revenue_cents' => 0,
        ];

        foreach ($funnels as $funnel) {
            foreach ($totals as $key => $value) {
                $totals[$key] = $value + (int) ($funnel[$key] ?? 0);
            }
        }

        $totals['ctr'] = $totals['impressions'] > 0 ? round(($totals['clicks'] / $totals['impressions']) * 100, 2) : null;
        $totals['cpc_cents'] = $totals['clicks'] > 0 ? (int) round($totals['spend_cents'] / $totals['clicks']) : null;
        $totals['cpm_cents'] = $totals['impressions'] > 0 ? (int) round(($totals['spend_cents'] / $totals['impressions']) * 1000) : null;
        $totals['cpl_cents'] = $totals['form_leads'] > 0 ? (int) round($totals['spend_cents'] / $totals['form_leads']) : null;
        $totals['cpql_cents'] = $totals['qualified'] > 0 ? (int) round($totals['spend_cents'] / $totals['qualified']) : null;
        $totals['cac_cents'] = $totals['won'] > 0 ? (int) round($totals['spend_cents'] / $totals['won']) : null;
        $totals['roas'] = $totals['spend_cents'] > 0 ? round($totals['revenue_cents'] / $totals['spend_cents'], 2) : null;
        $totals['revenue_per_lead_cents'] = $totals['form_leads'] > 0 ? (int) round($totals['revenue_cents'] / $totals['form_leads']) : null;

        return $totals;
    }
}
