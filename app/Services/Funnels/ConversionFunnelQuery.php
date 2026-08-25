<?php

namespace App\Services\Funnels;

use App\Models\AdCampaignStat;
use App\Models\ConversionFunnel;
use App\Models\FunnelEvent;
use App\Models\Workspace;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Aggregates funnel_events (+ ad spend) into stage counts, conversion rates,
 * source breakdown rows, and spend/CPL KPIs for a date window.
 */
class ConversionFunnelQuery
{
    private const TZ = 'Africa/Algiers';

    public function __construct(private ConversionFunnelProvisioner $provisioner) {}

    /**
     * @return array{
     *     funnel: array{id: int, name: string, slug: string},
     *     window: array{from: string, to: string, days: int, timezone: string},
     *     stages: array<int, array{key: string, label: string, count: int, rate_from_previous: float|null, rate_from_top: float|null}>,
     *     kpis: array{spend_cents: int, visits: int, orders: int, cpl_cents: int|null, conversion_rate: float|null},
     *     sources: array<int, array{source: string, visits: int, orders_placed: int, confirmed: int, delivered: int, spend_cents: int, cpl_cents: int|null}>
     * }
     */
    public function forFunnel(
        Workspace $workspace,
        ?ConversionFunnel $funnel,
        ?CarbonInterface $from = null,
        ?CarbonInterface $to = null,
    ): array {
        $funnel ??= $this->defaultFunnel($workspace);

        $to = $to ? Carbon::parse($to) : Carbon::now(self::TZ)->endOfDay();
        $from = $from ? Carbon::parse($from) : $to->copy()->subDays(29)->startOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $funnel->loadMissing('stages');

        $events = FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('conversion_funnel_id', $funnel->id)
            ->whereBetween('occurred_at', [$from, $to])
            ->get();

        $stageCounts = $this->stageCounts($funnel, $events);
        $topCount = max($stageCounts['visits'] ?? 0, 1);

        $stages = $funnel->stages->map(function ($stage, $index) use ($stageCounts, $topCount, $funnel) {
            $count = $stageCounts[$stage->key] ?? 0;
            $previousKey = $funnel->stages->get($index - 1)?->key;
            $previousCount = $previousKey ? ($stageCounts[$previousKey] ?? 0) : null;

            return [
                'key' => $stage->key,
                'label' => $stage->label,
                'count' => $count,
                'rate_from_previous' => $previousCount !== null && $previousCount > 0
                    ? round(($count / $previousCount) * 100, 1)
                    : null,
                'rate_from_top' => $topCount > 0 ? round(($count / $topCount) * 100, 1) : null,
            ];
        })->values()->all();

        $spendCents = $this->spendInWindow($workspace, $from, $to);
        $visits = $stageCounts['visits'] ?? 0;
        $orders = $stageCounts['orders_placed'] ?? 0;

        return [
            'funnel' => [
                'id' => $funnel->id,
                'name' => $funnel->name,
                'slug' => $funnel->slug,
            ],
            'window' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'days' => (int) $from->diffInDays($to) + 1,
                'timezone' => self::TZ,
            ],
            'stages' => $stages,
            'kpis' => [
                'spend_cents' => $spendCents,
                'visits' => $visits,
                'orders' => $orders,
                'cpl_cents' => $visits > 0 ? (int) round($spendCents / $visits) : null,
                'conversion_rate' => $visits > 0 ? round(($orders / $visits) * 100, 1) : null,
            ],
            'sources' => $this->sourceBreakdown($events, $spendCents, $workspace, $from, $to),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function stageCounts(ConversionFunnel $funnel, Collection $events): array
    {
        $counts = [];

        foreach ($funnel->stages as $stage) {
            $eventType = $stage->matcher_config['event_type'] ?? $stage->key;
            $counts[$stage->key] = $events
                ->where('event_type', $eventType)
                ->unique(fn (FunnelEvent $event) => filled($event->subject_type) && filled($event->subject_id)
                    ? $event->subject_type.'-'.$event->subject_id
                    : 'event-'.$event->id)
                ->count();
        }

        return $counts;
    }

    /**
     * @return array<int, array{source: string, visits: int, orders_placed: int, confirmed: int, delivered: int, spend_cents: int, cpl_cents: int|null}>
     */
    private function sourceBreakdown(
        Collection $events,
        int $totalSpendCents,
        Workspace $workspace,
        Carbon $from,
        Carbon $to,
    ): array {
        $sources = $events
            ->map(fn (FunnelEvent $event) => $event->source ?: 'direct')
            ->unique()
            ->values();

        if ($sources->isEmpty()) {
            $sources = collect(['direct']);
        }

        $campaignSpend = AdCampaignStat::query()
            ->forWorkspace($workspace)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('ad_campaign_id, COALESCE(SUM(spend_cents), 0) as spend_cents')
            ->groupBy('ad_campaign_id')
            ->pluck('spend_cents', 'ad_campaign_id');

        return $sources->map(function (string $source) use ($events, $campaignSpend, $totalSpendCents) {
            $rows = $events->filter(fn (FunnelEvent $event) => ($event->source ?: 'direct') === $source);

            $visits = $rows->where('event_type', FunnelEvent::TYPE_VISIT)->count();
            $orders = $rows->where('event_type', FunnelEvent::TYPE_ORDER_PLACED)->count();
            $confirmed = $rows->where('event_type', FunnelEvent::TYPE_CONFIRMED)->count();
            $delivered = $rows->where('event_type', FunnelEvent::TYPE_DELIVERED)->count();

            $spendCents = (int) $rows
                ->pluck('ad_campaign_id')
                ->filter()
                ->unique()
                ->sum(fn ($id) => (int) ($campaignSpend[$id] ?? 0));

            if ($spendCents === 0 && in_array($source, ['facebook', 'instagram', 'meta'], true)) {
                $spendCents = $totalSpendCents;
            }

            return [
                'source' => $source,
                'visits' => $visits,
                'orders_placed' => $orders,
                'confirmed' => $confirmed,
                'delivered' => $delivered,
                'spend_cents' => $spendCents,
                'cpl_cents' => $visits > 0 ? (int) round($spendCents / $visits) : null,
            ];
        })->sortByDesc('visits')->values()->all();
    }

    private function spendInWindow(Workspace $workspace, Carbon $from, Carbon $to): int
    {
        return (int) AdCampaignStat::query()
            ->forWorkspace($workspace)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->sum('spend_cents');
    }

    private function defaultFunnel(Workspace $workspace): ConversionFunnel
    {
        $funnel = ConversionFunnel::query()
            ->forWorkspace($workspace)
            ->where('is_default', true)
            ->first();

        return $funnel ?? $this->provisioner->provision($workspace);
    }
}
