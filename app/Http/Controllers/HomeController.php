<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\Workspace;
use App\Support\Integrations;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home — the calm command center. Answers two questions: what needs me
 * (today strip + next steps) and where do I go (department tiles). Every
 * number comes from an existing model; nothing is invented, and connection
 * warnings stay on Settings → Apps instead of this page.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $today = now('Africa/Algiers')->toDateString();
        $ownerId = $request->integer('owner_id') ?: null;
        $period = $request->string('period')->toString() ?: 'today';

        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

        if ($ownerId) {
            $openDeals->where('owner_id', $ownerId);
        }

        $outbound = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out');

        $unread = (int) Thread::query()->forWorkspace($workspace)->sum('unread_count');
        $leadsNewToday = Lead::query()
            ->forWorkspace($workspace)
            ->whereDate('created_at', $today)
            ->count();
        $sentToday = (clone $outbound)
            ->where('status', 'sent')
            ->whereDate('sent_at', $today)
            ->count();

        $integrations = Integrations::forWorkspace($workspace);
        $connectedApps = collect($integrations)->where('connected', true)->count();

        // Ads is wired when either the env-driven Marketing API sync or the
        // workspace Meta OAuth connection exists — same truth as /ads.
        $metaConnected = (filled(config('meta.access_token')) && filled(config('meta.app_id')))
            || ($workspace->integration(Integration::PROVIDER_META)?->isConnected() ?? false);

        $openDealsCount = (clone $openDeals)->count();
        $tasksDue = Activity::query()
            ->forWorkspace($workspace)
            ->where('type', 'task')
            ->where('done', false)
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now('Africa/Algiers')->endOfDay())
            ->count();
        $deferredCount = (clone $outbound)
            ->where('status', 'queued')
            ->whereNotNull('deferred_until')
            ->where('deferred_until', '>', now())
            ->count();
        $contactTotal = Contact::query()->forWorkspace($workspace)->count();

        return Inertia::render('home', [
            'today' => [
                [
                    'key' => 'open_deals',
                    'label' => 'Open deals',
                    'value' => $openDealsCount,
                    'hint' => 'Active pipeline — not won or lost',
                    'href' => '/crm/deals',
                ],
                [
                    'key' => 'tasks_due',
                    'label' => 'Tasks due today',
                    'value' => $tasksDue,
                    'hint' => $tasksDue > 0 ? 'Needs attention today' : 'Nothing due today',
                    'href' => '/crm/contacts',
                ],
                [
                    'key' => 'inbox_unread',
                    'label' => 'Unread in desk',
                    'value' => $unread,
                    'hint' => $unread > 0 ? 'Conversations waiting' : 'Inbox clear',
                    'href' => '/inbox',
                ],
                [
                    'key' => 'leads_new',
                    'label' => 'New leads today',
                    'value' => $leadsNewToday,
                    'hint' => 'Captured since midnight Algiers',
                    'href' => '/leads',
                ],
                [
                    'key' => 'outbound_sent',
                    'label' => 'Sent today',
                    'value' => $sentToday,
                    'hint' => 'Outbound messages delivered',
                    'href' => '/outbound',
                ],
                [
                    'key' => 'outbound_deferred',
                    'label' => 'Deferred sends',
                    'value' => $deferredCount,
                    'hint' => 'Queued for later delivery',
                    'href' => '/outbound',
                ],
            ],
            'nextSteps' => Activity::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'deal.stage', 'owner'])
                ->where('type', 'task')
                ->where('done', false)
                ->orderByRaw('due_at is null')
                ->orderBy('due_at')
                ->limit(5)
                ->get(),
            'departments' => [
                ['key' => 'inbox', 'name' => 'Inbox', 'href' => '/inbox', 'value' => $unread, 'value_label' => 'unread'],
                ['key' => 'leads', 'name' => 'Leads', 'href' => '/leads', 'value' => $leadsNewToday, 'value_label' => 'new today'],
                ['key' => 'contacts', 'name' => 'Contacts', 'href' => '/crm/contacts', 'value' => $contactTotal, 'value_label' => 'total'],
                ['key' => 'ads', 'name' => 'Ads', 'href' => '/ads', 'connected' => $metaConnected],
                ['key' => 'outbound', 'name' => 'Outbound', 'href' => '/outbound', 'value' => $sentToday, 'value_label' => 'sent today'],
                ['key' => 'integrations', 'name' => 'Integrations', 'href' => '/settings/apps', 'value' => $connectedApps, 'value_label' => 'of '.count($integrations).' connected'],
            ],
            'charts' => $this->evoVizCharts($workspace),
            'owners' => $workspace->users()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'owner_id' => $ownerId,
                'period' => $period,
            ],
            'dataAsOf' => now('Africa/Algiers')->format('Y-m-d H:i'),
        ]);
    }

    /**
     * EvoViz payloads (contract: resources/js/evoviz/contract.ts). Every
     * series comes from an existing model; a chart whose series is all
     * zeros is omitted instead of drawing a fake shape.
     *
     * @return array<int, array<string, mixed>>
     */
    private function evoVizCharts(Workspace $workspace): array
    {
        return collect([
            $this->pipelineByStageChart($workspace),
            $this->leadsAreaChart($workspace),
            $this->outboundSparkChart($workspace),
            $this->dealOutcomeChart($workspace),
        ])->filter()->values()->all();
    }

    /** evoviz.bar — open pipeline stages by live deal count. */
    private function pipelineByStageChart(Workspace $workspace): ?array
    {
        $stages = $workspace->defaultPipeline()->stages()
            ->where('is_won', false)
            ->where('is_lost', false)
            ->withCount('deals')
            ->get();

        if ($stages->sum('deals_count') === 0) {
            return null;
        }

        return [
            'id' => 'evoviz.bar',
            'title' => 'Pipeline by stage',
            'labels' => $stages->pluck('name')->all(),
            'series' => [['name' => 'Deals', 'data' => $stages->pluck('deals_count')->all()]],
            'total' => (int) $stages->sum('deals_count'),
            'href' => '/leads',
        ];
    }

    /** evoviz.area — leads created per day over the last 14 days. */
    private function leadsAreaChart(Workspace $workspace): ?array
    {
        [$labels, $data] = $this->dailySeries(
            Lead::query()->forWorkspace($workspace)
                ->where('created_at', '>=', $this->windowStart())
                ->get(['created_at'])
                ->map(fn (Lead $lead) => $lead->created_at),
        );

        if (array_sum($data) === 0) {
            return null;
        }

        return [
            'id' => 'evoviz.area',
            'title' => 'New leads — last 14 days',
            'labels' => $labels,
            'series' => [['name' => 'New leads', 'data' => $data]],
            'total' => array_sum($data),
            'href' => '/leads',
        ];
    }

    /** evoviz.kpi-spark — outbound messages sent per day, last 14 days. */
    private function outboundSparkChart(Workspace $workspace): ?array
    {
        [$labels, $data] = $this->dailySeries(
            OutboundMessage::query()->forWorkspace($workspace)
                ->where('direction', 'out')
                ->where('status', 'sent')
                ->where('sent_at', '>=', $this->windowStart())
                ->get(['sent_at'])
                ->map(fn (OutboundMessage $message) => $message->sent_at),
        );

        if (array_sum($data) === 0) {
            return null;
        }

        return [
            'id' => 'evoviz.kpi-spark',
            'title' => 'Outbound sent — last 14 days',
            'labels' => $labels,
            'series' => [['name' => 'Sent', 'data' => $data]],
            'total' => array_sum($data),
            'href' => '/outbound',
        ];
    }

    /** evoviz.donut — every deal by open / won / lost outcome. */
    private function dealOutcomeChart(Workspace $workspace): ?array
    {
        $deals = fn () => Deal::query()->forWorkspace($workspace);

        $open = $deals()->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false))->count();
        $won = $deals()->whereHas('stage', fn ($q) => $q->where('is_won', true))->count();
        $lost = $deals()->whereHas('stage', fn ($q) => $q->where('is_lost', true))->count();

        if ($open + $won + $lost === 0) {
            return null;
        }

        return [
            'id' => 'evoviz.donut',
            'title' => 'Deals by outcome',
            'labels' => ['Open', 'Won', 'Lost'],
            'series' => [['name' => 'Deals', 'data' => [$open, $won, $lost]]],
            'total' => $open + $won + $lost,
            'valueLabel' => 'deals',
            'href' => '/crm/deals',
        ];
    }

    private function windowStart(): CarbonInterface
    {
        return now('Africa/Algiers')->subDays(13)->startOfDay();
    }

    /**
     * Bucket datetimes into the last 14 Algiers days, oldest first.
     *
     * @param  Collection<int, CarbonInterface|null>  $dates
     * @return array{0: array<int, string>, 1: array<int, int>}
     */
    private function dailySeries($dates): array
    {
        $days = collect(range(13, 0))
            ->map(fn (int $ago) => now('Africa/Algiers')->subDays($ago)->toDateString());

        $counts = $dates
            ->filter()
            ->map(fn (CarbonInterface $date) => $date->copy()->setTimezone('Africa/Algiers')->toDateString())
            ->countBy();

        return [
            $days->map(fn (string $day) => Carbon::parse($day)->format('d/m'))->all(),
            $days->map(fn (string $day) => (int) $counts->get($day, 0))->all(),
        ];
    }
}
