<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\AdLead;
use App\Models\Dashboard;
use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\Message;
use App\Models\OutboundCampaign;
use App\Models\OutboundMessage;
use App\Models\SavedReport;
use App\Models\ScheduledReport;
use App\Models\Sequence;
use App\Models\Suppression;
use App\Models\Thread;
use App\Models\User;
use App\Models\Workspace;
use App\Services\LeadOs\GraphRunner;
use App\Services\LeadOs\LostReview;
use App\Support\ReportWidgets;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Reports — the deep per-category analytics room. Every category answers
 * with KPIs + EvoViz charts (contract: resources/js/evoviz/contract.ts) +
 * a compact backing table, all from real workspace rows inside an
 * Africa/Algiers window (default: last 30 days, optional ?from=&to=).
 * A category with no rows behind it is omitted; a chart whose series is
 * all zeros is omitted — nothing is invented.
 *
 * Additive on the same page: saved dashboards (name / owner / widgets
 * JSON) and a global owner filter that scopes every room and the open
 * dashboard to a workspace teammate.
 */
class ReportController extends Controller
{
    private const TZ = 'Africa/Algiers';

    private const MAX_DAYS = 92;

    private ?int $ownerId = null;

    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $category = $request->route('category');

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'owner' => ['nullable', 'integer', Rule::exists('users', 'id')->where('workspace_id', $workspace->id)],
            'dashboard' => ['nullable', 'integer'],
        ]);

        $this->ownerId = isset($validated['owner']) ? (int) $validated['owner'] : null;

        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'], self::TZ)->endOfDay()
            : now(self::TZ)->endOfDay();
        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'], self::TZ)->startOfDay()
            : $to->copy()->subDays(29)->startOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        if ($from->diffInDays($to) >= self::MAX_DAYS) {
            $from = $to->copy()->subDays(self::MAX_DAYS - 1)->startOfDay();
        }

        $categories = collect([
            $this->pipelineCategory($workspace, $from, $to),
            $this->leadsCategory($workspace, $from, $to),
            $this->outboundCategory($workspace, $from, $to),
            $this->adsCategory($workspace, $from, $to),
            $this->deskCategory($workspace, $from, $to),
            $this->activityCategory($workspace, $from, $to),
        ])->filter()->map(fn (array $room) => $this->localizeChrome($room))->values();

        $keyMap = ['sales' => 'leads', 'pipeline' => 'pipeline', 'outbound' => 'outbound', 'ads' => 'ads'];
        if ($category !== null && isset($keyMap[$category])) {
            $categories = $categories->filter(fn (array $room) => $room['key'] === $keyMap[$category])->values();
        }
        $categories = $categories->all();

        $open = null;

        if ($request->filled('dashboard')) {
            $open = Dashboard::query()
                ->forWorkspace($workspace)
                ->with('owner')
                ->find($request->integer('dashboard'));
            abort_unless($open !== null, 404);
        }

        return Inertia::render('crm/reports', [
            'activeCategory' => $category ?? 'overview',
            'outboundDetail' => $category === 'outbound' ? $this->outboundDetail($workspace, $from, $to) : null,
            'window' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'days' => (int) $from->diffInDays($to) + 1,
                'timezone' => self::TZ,
                'custom' => $request->filled('from') || $request->filled('to'),
                'owner_id' => $this->ownerId,
            ],
            'categories' => $categories,
            'owners' => User::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
                ->values()
                ->all(),
            'dashboards' => Dashboard::query()
                ->forWorkspace($workspace)
                ->with('owner')
                ->where(function ($query) use ($request) {
                    $query->where('owner_id', $request->user()->id)
                        ->orWhereIn('visibility', ['workspace', 'team']);
                })
                ->orderBy('name')
                ->get()
                ->map(fn (Dashboard $dashboard) => [
                    'id' => $dashboard->id,
                    'name' => $dashboard->name,
                    'visibility' => $dashboard->visibility ?? 'private',
                    'owner' => [
                        'id' => $dashboard->owner_id,
                        'name' => $dashboard->owner?->name,
                    ],
                    'widget_count' => count($dashboard->widgetKeys()),
                ])
                ->all(),
            'dashboard' => $this->presentDashboard($open, $categories),
            'widgetCatalog' => ReportWidgets::catalog(),
            'schedules' => ScheduledReport::query()
                ->forWorkspace($workspace)
                ->latest()
                ->get()
                ->map(fn (ScheduledReport $schedule) => [
                    'id' => $schedule->id,
                    'name' => $schedule->name,
                    'cron' => $schedule->cron,
                    'recipients' => $schedule->recipients,
                    'active' => $schedule->active,
                    'last_status' => $schedule->last_status,
                    'last_error' => $schedule->last_error,
                    'last_sent_at' => $schedule->last_sent_at?->toIso8601String(),
                ])
                ->all(),
            'savedReports' => SavedReport::query()
                ->forWorkspace($workspace)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->all(),
            'leadOsGraph' => app(GraphRunner::class)->latest($workspace)?->present(),
            'lostReview' => app(LostReview::class)->present($workspace),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /* Pipeline — deals by stage, window outcomes, value flow */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function pipelineCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $stages = $workspace->defaultPipeline()->stages()->orderBy('position')->get();
        $deals = $this->constrainOwner(Deal::query()->forWorkspace($workspace)->with('stage'))->get();

        if ($deals->isEmpty()) {
            return null;
        }

        $open = $deals->filter(fn (Deal $deal) => $deal->stage && ! $deal->stage->isTerminal());
        $won = $deals->filter(fn (Deal $deal) => $deal->stage?->is_won && $this->inWindow($deal->closed_at, $from, $to));
        $lost = $deals->filter(fn (Deal $deal) => $deal->stage?->is_lost && $this->inWindow($deal->closed_at, $from, $to));
        $closed = $won->count() + $lost->count();

        $kpis = array_values(array_filter([
            ['label' => 'Open deals', 'value' => $open->count(), 'format' => 'number'],
            ['label' => 'Open pipeline', 'value' => (int) $open->sum('amount_cents'), 'format' => 'money'],
            ['label' => 'Won in window', 'value' => $won->count(), 'format' => 'number', 'hint' => $this->dzd($won->sum('amount_cents'))],
            ['label' => 'Lost in window', 'value' => $lost->count(), 'format' => 'number', 'hint' => $this->dzd($lost->sum('amount_cents'))],
            $closed > 0
                ? ['label' => 'Win rate', 'value' => (int) round($won->count() / $closed * 100), 'format' => 'percent', 'hint' => 'of deals closed in window']
                : null,
        ]));

        $openStages = $stages->where('is_won', false)->where('is_lost', false);

        $amountByStage = $this->chart([
            'id' => 'evoviz.bar',
            'title' => 'Open pipeline value by stage',
            'labels' => $openStages->pluck('name')->all(),
            'series' => [[
                'name' => 'Open value',
                'data' => $openStages->map(fn ($stage) => (int) round($open->where('stage_id', $stage->id)->sum('amount_cents') / 100))->all(),
            ]],
            'total' => (int) round($open->sum('amount_cents') / 100),
            'valueLabel' => 'DA',
            'href' => '/leads',
        ]);

        [$wonLabels, $wonData] = $this->dailySeries($won->map(fn (Deal $deal) => $deal->closed_at), $from, $to);
        $wonDaily = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'Deals won per day',
            'labels' => $wonLabels,
            'series' => [['name' => 'Won', 'data' => $wonData]],
            'total' => array_sum($wonData),
            'valueLabel' => 'deals',
            'href' => '/crm/deals',
        ]);

        $outcomes = $this->chart([
            'id' => 'evoviz.donut',
            'title' => 'Outcomes in window',
            'labels' => ['Won', 'Lost'],
            'series' => [['name' => 'Deals', 'data' => [$won->count(), $lost->count()]]],
            'total' => $closed,
            'valueLabel' => 'closed',
            'href' => '/crm/deals',
        ]);

        $rows = $stages->map(function ($stage) use ($deals, $won, $lost) {
            $stageDeals = $deals->where('stage_id', $stage->id);

            if ($stage->is_won) {
                return [$stage->name, null, null, $won->count(), (int) $won->sum('amount_cents')];
            }

            if ($stage->is_lost) {
                return [$stage->name, null, null, $lost->count(), (int) $lost->sum('amount_cents')];
            }

            return [$stage->name, $stageDeals->count(), (int) $stageDeals->sum('amount_cents'), null, null];
        })->all();

        return [
            'key' => 'pipeline',
            'title' => 'Pipeline',
            'description' => 'Open value by stage, wins per day, and window outcomes from the live deal engine.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$amountByStage, $wonDaily, $outcomes])),
            'table' => [
                'columns' => [
                    ['key' => 'stage', 'label' => 'Stage'],
                    ['key' => 'open', 'label' => 'Open deals', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'open_value', 'label' => 'Open value', 'format' => 'money', 'align' => 'right'],
                    ['key' => 'closed', 'label' => 'Closed in window', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'closed_value', 'label' => 'Closed value', 'format' => 'money', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Leads — intake per day, status mix, sources */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function leadsCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $created = $this->constrainContactOwner(
            Lead::query()->forWorkspace($workspace)->whereBetween('created_at', [$from, $to])
        )->get();
        $qualified = $this->constrainContactOwner(
            Lead::query()->forWorkspace($workspace)
                ->whereNotNull('qualified_at')
                ->whereBetween('qualified_at', [$from, $to])
        )->get();

        if ($created->isEmpty() && $qualified->isEmpty()) {
            return null;
        }

        $withDeal = $created->filter(fn (Lead $lead) => $lead->deal()->exists())->count();

        $kpis = array_values(array_filter([
            ['label' => 'New leads', 'value' => $created->count(), 'format' => 'number'],
            ['label' => 'Qualified', 'value' => $qualified->count(), 'format' => 'number'],
            $created->count() > 0
                ? ['label' => 'Qualification rate', 'value' => (int) round($created->where('status', 'qualified')->count() / $created->count() * 100), 'format' => 'percent', 'hint' => 'of leads created in window']
                : null,
            ['label' => 'Converted to deal', 'value' => $withDeal, 'format' => 'number'],
        ]));

        [$dayLabels, $dayData] = $this->dailySeries($created->map(fn (Lead $lead) => $lead->created_at), $from, $to);
        $intake = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'New leads per day',
            'labels' => $dayLabels,
            'series' => [['name' => 'New leads', 'data' => $dayData]],
            'total' => array_sum($dayData),
            'href' => '/crm/leads',
        ]);

        $byStatus = $created->groupBy(fn (Lead $lead) => $lead->status ?? 'new')->map->count()->sortDesc();
        $statusChart = $this->chart([
            'id' => 'evoviz.donut',
            'title' => 'Leads by status',
            'labels' => $byStatus->keys()->map(fn ($s) => ucfirst((string) $s))->all(),
            'series' => [['name' => 'Leads', 'data' => $byStatus->values()->all()]],
            'total' => $created->count(),
            'valueLabel' => 'leads',
            'href' => '/crm/leads',
        ]);

        $bySource = $created->groupBy(fn (Lead $lead) => $lead->source ?: 'unknown');
        $sourceChart = $this->chart([
            'id' => 'evoviz.ranked-bars',
            'title' => 'Leads by source',
            'labels' => $bySource->keys()->all(),
            'series' => [['name' => 'Leads', 'data' => $bySource->map->count()->values()->all()]],
            'total' => $created->count(),
            'href' => '/crm/leads',
        ]);

        $rows = $bySource->map(function ($rows, $source) {
            $qualifiedCount = $rows->where('status', 'qualified')->count();

            return [
                (string) ($source ?: 'unknown'),
                $rows->count(),
                $qualifiedCount,
                $rows->count() > 0 ? (int) round($qualifiedCount / $rows->count() * 100) : null,
            ];
        })->sortByDesc(fn ($row) => $row[1])->values()->all();

        return [
            'key' => 'leads',
            'title' => 'Leads',
            'description' => 'Intake volume, status mix, and which sources actually qualify.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$intake, $statusChart, $sourceChart])),
            'table' => [
                'columns' => [
                    ['key' => 'source', 'label' => 'Source'],
                    ['key' => 'leads', 'label' => 'Leads', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'qualified', 'label' => 'Qualified', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'rate', 'label' => 'Rate', 'format' => 'percent', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Outbound — sends, engagement, per-day backing */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function outboundCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $sent = $this->constrainContactOwner(
            OutboundMessage::query()->forWorkspace($workspace)
                ->where('direction', 'out')
                ->where('status', 'sent')
                ->whereBetween('sent_at', [$from, $to])
        )->get();
        $failed = $this->constrainContactOwner(
            OutboundMessage::query()->forWorkspace($workspace)
                ->where('direction', 'out')
                ->where('status', 'failed')
                ->whereBetween('created_at', [$from, $to])
        )->count();

        if ($sent->isEmpty() && $failed === 0) {
            return null;
        }

        $opened = $sent->whereNotNull('opened_at')->count();
        $clicked = $sent->whereNotNull('clicked_at')->count();
        $replied = $sent->whereNotNull('replied_at')->count();

        $kpis = array_values(array_filter([
            ['label' => 'Sent', 'value' => $sent->count(), 'format' => 'number'],
            ['label' => 'Opened', 'value' => $opened, 'format' => 'number', 'hint' => 'pixel — mail clients that load images'],
            ['label' => 'Clicked', 'value' => $clicked, 'format' => 'number'],
            ['label' => 'Replied', 'value' => $replied, 'format' => 'number', 'hint' => 'matched by the IMAP poller'],
            $sent->count() > 0
                ? ['label' => 'Open rate', 'value' => (int) round($opened / $sent->count() * 100), 'format' => 'percent']
                : null,
            ['label' => 'Failed', 'value' => $failed, 'format' => 'number'],
        ]));

        [$dayLabels, $dayData] = $this->dailySeries($sent->map(fn (OutboundMessage $m) => $m->sent_at), $from, $to);
        $sendsChart = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'Sent per day',
            'labels' => $dayLabels,
            'series' => [['name' => 'Sent', 'data' => $dayData]],
            'total' => array_sum($dayData),
            'href' => '/outbound/outbox',
        ]);

        $engagement = $this->chart([
            'id' => 'evoviz.bar',
            'title' => 'Engagement of window sends',
            'labels' => ['Sent', 'Opened', 'Clicked', 'Replied'],
            'series' => [['name' => 'Messages', 'data' => [$sent->count(), $opened, $clicked, $replied]]],
            'total' => $sent->count(),
            'href' => '/outbound/reports',
        ]);

        $rows = $sent->groupBy(fn (OutboundMessage $m) => $m->sent_at->copy()->setTimezone(self::TZ)->toDateString())
            ->sortKeysDesc()
            ->take(10)
            ->map(fn (Collection $day, $date) => [
                Carbon::parse($date)->format('d/m'),
                $day->count(),
                $day->whereNotNull('opened_at')->count(),
                $day->whereNotNull('clicked_at')->count(),
                $day->whereNotNull('replied_at')->count(),
            ])
            ->values()
            ->all();

        return [
            'key' => 'outbound',
            'title' => 'Outbound',
            'description' => 'What left the mailboxes and how recipients engaged — honest counts, no ESP bounce guesses.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$sendsChart, $engagement])),
            'table' => [
                'columns' => [
                    ['key' => 'day', 'label' => 'Day'],
                    ['key' => 'sent', 'label' => 'Sent', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'opened', 'label' => 'Opened', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'clicked', 'label' => 'Clicked', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'replied', 'label' => 'Replied', 'format' => 'number', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Ads — spend, funnel, per-campaign backing (omitted without rows) */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function adsCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $hasRows = AdCampaign::query()->forWorkspace($workspace)->exists()
            || AdCampaignStat::query()->forWorkspace($workspace)->exists()
            || AdLead::query()->forWorkspace($workspace)->exists();

        if (! $hasRows) {
            return null;
        }

        $stats = AdCampaignStat::query()->forWorkspace($workspace)
            ->whereBetween('date', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->get();
        $adLeads = $this->constrainContactOwner(
            AdLead::query()->forWorkspace($workspace)->whereBetween('created_at', [$from, $to])
        )->get();
        $campaigns = AdCampaign::query()->forWorkspace($workspace)->get();

        $impressions = (int) $stats->sum('impressions');
        $clicks = (int) $stats->sum('clicks');
        $spendCents = (int) $stats->sum('spend_cents');

        $kpis = array_values(array_filter([
            ['label' => 'Spend', 'value' => $spendCents, 'format' => 'money'],
            ['label' => 'Impressions', 'value' => $impressions, 'format' => 'number'],
            ['label' => 'Clicks', 'value' => $clicks, 'format' => 'number'],
            $impressions > 0
                ? ['label' => 'CTR', 'value' => round($clicks / $impressions * 100, 1), 'format' => 'percent']
                : null,
            ['label' => 'Ad leads', 'value' => $adLeads->count(), 'format' => 'number'],
            $adLeads->count() > 0
                ? ['label' => 'Cost per lead', 'value' => (int) round($spendCents / $adLeads->count()), 'format' => 'money']
                : null,
        ]));

        [$dayLabels, $spendData] = $this->dailySeries(
            $stats->map(fn (AdCampaignStat $stat) => $stat->date),
            $from, $to,
            $stats->map(fn (AdCampaignStat $stat) => (int) round($stat->spend_cents / 100)),
        );
        $spendChart = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'Spend per day',
            'labels' => $dayLabels,
            'series' => [['name' => 'Spend', 'data' => $spendData]],
            'total' => array_sum($spendData),
            'valueLabel' => 'DA',
            'href' => '/ads',
        ]);

        $perCampaign = $campaigns->map(fn (AdCampaign $campaign) => [
            'name' => $campaign->name,
            'stats' => $stats->where('ad_campaign_id', $campaign->id),
            'leads' => $adLeads->where('ad_campaign_id', $campaign->id)->count(),
        ])->sortByDesc(fn ($row) => $row['stats']->sum('spend_cents'))->values();

        $campaignChart = $this->chart([
            'id' => 'evoviz.ranked-bars',
            'title' => 'Spend by campaign',
            'labels' => $perCampaign->take(6)->pluck('name')->all(),
            'series' => [['name' => 'Spend', 'data' => $perCampaign->take(6)->map(fn ($row) => (int) round($row['stats']->sum('spend_cents') / 100))->all()]],
            'total' => (int) round($spendCents / 100),
            'valueLabel' => 'DA',
            'href' => '/ads',
        ]);

        $rows = $perCampaign->take(8)->map(fn ($row) => [
            $row['name'],
            (int) $row['stats']->sum('impressions'),
            (int) $row['stats']->sum('clicks'),
            (int) $row['stats']->sum('spend_cents'),
            $row['leads'],
            $row['leads'] > 0 ? (int) round($row['stats']->sum('spend_cents') / $row['leads']) : null,
        ])->all();

        return [
            'key' => 'ads',
            'title' => 'Ads',
            'description' => 'Spend and lead return per campaign — synced Marketing API stats and lead-form rows only.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$spendChart, $campaignChart])),
            'table' => [
                'columns' => [
                    ['key' => 'campaign', 'label' => 'Campaign'],
                    ['key' => 'impressions', 'label' => 'Impr.', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'clicks', 'label' => 'Clicks', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'spend', 'label' => 'Spend', 'format' => 'money', 'align' => 'right'],
                    ['key' => 'leads', 'label' => 'Leads', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'cpl', 'label' => 'Cost/lead', 'format' => 'money', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Desk — threads and messages (omitted without conversations) */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function deskCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $threads = $this->constrainContactOwner(
            Thread::query()->forWorkspace($workspace)->with('channel')
        )->get();
        $messages = $this->constrainContactOwner(
            Message::query()->forWorkspace($workspace)->whereBetween('created_at', [$from, $to])
        )->get();

        if ($threads->isEmpty() && $messages->isEmpty()) {
            return null;
        }

        $inbound = $messages->where('direction', 'inbound')->count();
        $outbound = $messages->where('direction', 'outbound')->count();

        $kpis = [
            ['label' => 'Open threads', 'value' => $threads->where('status', 'open')->count(), 'format' => 'number'],
            ['label' => 'Unread messages', 'value' => (int) $threads->sum('unread_count'), 'format' => 'number'],
            ['label' => 'Messages in window', 'value' => $messages->count(), 'format' => 'number'],
            ['label' => 'Inbound', 'value' => $inbound, 'format' => 'number'],
            ['label' => 'Outbound', 'value' => $outbound, 'format' => 'number'],
        ];

        [$dayLabels, $dayData] = $this->dailySeries($messages->map(fn (Message $m) => $m->created_at), $from, $to);
        $traffic = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'Messages per day',
            'labels' => $dayLabels,
            'series' => [['name' => 'Messages', 'data' => $dayData]],
            'total' => array_sum($dayData),
            'href' => '/conversations',
        ]);

        $byStatus = $threads->groupBy(fn (Thread $thread) => $thread->status ?? 'open')->map->count()->sortDesc();
        $statusChart = $this->chart([
            'id' => 'evoviz.donut',
            'title' => 'Threads by status',
            'labels' => $byStatus->keys()->map(fn ($s) => ucfirst((string) $s))->all(),
            'series' => [['name' => 'Threads', 'data' => $byStatus->values()->all()]],
            'total' => $threads->count(),
            'valueLabel' => 'threads',
            'href' => '/conversations',
        ]);

        $rows = $threads->groupBy('channel_id')->map(function (Collection $group, $channelId) use ($messages) {
            $channel = $group->first()->channel;
            $threadIds = $group->pluck('id');

            return [
                $channel?->name ?? 'Unknown channel',
                $group->count(),
                (int) $group->sum('unread_count'),
                $messages->whereIn('thread_id', $threadIds)->count(),
            ];
        })->sortByDesc(fn ($row) => $row[3])->values()->all();

        return [
            'key' => 'desk',
            'title' => 'Desk',
            'description' => 'Conversation load across channels — CRM history synced from the desk, not a second inbox.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$traffic, $statusChart])),
            'table' => [
                'columns' => [
                    ['key' => 'channel', 'label' => 'Channel'],
                    ['key' => 'threads', 'label' => 'Threads', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'unread', 'label' => 'Unread', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'messages', 'label' => 'Messages in window', 'format' => 'number', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Activity — tasks, completion, per-owner load */
    /* ------------------------------------------------------------------ */

    /** @return array<string, mixed>|null */
    private function activityCategory(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): ?array
    {
        $all = $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)->with('owner')
        )->get();

        if ($all->isEmpty()) {
            return null;
        }

        $created = $all->filter(fn (Activity $a) => $this->inWindow($a->created_at, $from, $to));
        $completed = $all->filter(fn (Activity $a) => $a->done && $this->inWindow($a->completed_at, $from, $to));
        $openTasks = $all->where('type', 'task')->where('done', false);
        $overdue = $openTasks->filter(fn (Activity $a) => $a->due_at !== null && $a->due_at->isPast());

        $kpis = [
            ['label' => 'Completed in window', 'value' => $completed->count(), 'format' => 'number'],
            ['label' => 'Open tasks', 'value' => $openTasks->count(), 'format' => 'number'],
            ['label' => 'Overdue', 'value' => $overdue->count(), 'format' => 'number'],
            ['label' => 'Logged in window', 'value' => $created->count(), 'format' => 'number'],
        ];

        $byType = $created->groupBy(fn (Activity $a) => $a->type ?? 'note')->map->count()->sortDesc();
        $typeChart = $this->chart([
            'id' => 'evoviz.bar',
            'title' => 'Logged by type',
            'labels' => $byType->keys()->map(fn ($t) => ucfirst(str_replace('_', ' ', (string) $t)))->all(),
            'series' => [['name' => 'Activities', 'data' => $byType->values()->all()]],
            'total' => $created->count(),
        ]);

        [$dayLabels, $doneData] = $this->dailySeries($completed->map(fn (Activity $a) => $a->completed_at), $from, $to);
        $doneChart = $this->chart([
            'id' => 'evoviz.area',
            'title' => 'Completed per day',
            'labels' => $dayLabels,
            'series' => [['name' => 'Completed', 'data' => $doneData]],
            'total' => array_sum($doneData),
        ]);

        $rows = $all->groupBy('owner_id')->map(function (Collection $group) use ($completed) {
            $owner = $group->first()->owner;
            $tasks = $group->where('type', 'task')->where('done', false);

            return [
                $owner?->name ?? 'Unassigned',
                $tasks->count(),
                $tasks->filter(fn (Activity $a) => $a->due_at !== null && $a->due_at->isPast())->count(),
                $completed->whereIn('id', $group->pluck('id'))->count(),
            ];
        })->sortByDesc(fn ($row) => $row[1] + $row[3])->values()->all();

        return [
            'key' => 'activity',
            'title' => 'Activity',
            'description' => 'Notes, tasks, calls and meetings — what the team logged and finished.',
            'kpis' => $kpis,
            'charts' => array_values(array_filter([$typeChart, $doneChart])),
            'table' => [
                'columns' => [
                    ['key' => 'owner', 'label' => 'Owner'],
                    ['key' => 'open', 'label' => 'Open tasks', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'overdue', 'label' => 'Overdue', 'format' => 'number', 'align' => 'right'],
                    ['key' => 'done', 'label' => 'Done in window', 'format' => 'number', 'align' => 'right'],
                ],
                'rows' => $rows,
            ],
        ];
    }

    private function outboundDetail(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): array
    {
        $out = $this->constrainContactOwner(OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'out')
            ->where(function (Builder $query) use ($from, $to): void {
                $query
                    ->whereBetween('sent_at', [$from, $to])
                    ->orWhere(function (Builder $unsent) use ($from, $to): void {
                        $unsent->whereNull('sent_at')->whereBetween('created_at', [$from, $to]);
                    });
            }));
        $totals = ['queued' => (clone $out)->where('status', 'queued')->count(), 'sent' => (clone $out)->where('status', 'sent')->count(), 'failed' => (clone $out)->where('status', 'failed')->count(), 'opened' => (clone $out)->whereNotNull('opened_at')->count(), 'clicked' => (clone $out)->whereNotNull('clicked_at')->count(), 'replied' => (clone $out)->whereNotNull('replied_at')->count(), 'delivered' => (clone $out)->whereNotNull('delivered_at')->count(), 'complained' => (clone $out)->whereNotNull('complained_at')->count(), 'bounced' => (clone $out)->where(fn ($query) => $query->where('status', 'bounced')->orWhereNotNull('bounced_at'))->count()];
        $campaignIds = (clone $out)->whereNotNull('campaign_id')->pluck('campaign_id')->filter()->unique()->values();
        $selected = $campaignIds->isEmpty()
            ? 0
            : (int) OutboundCampaign::query()->forWorkspace($workspace)->whereIn('id', $campaignIds)->sum('audience_count');
        $attempted = (clone $out)->where('status', '!=', 'queued')->count();
        $positiveReplies = $this->constrainContactOwner(OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('direction', 'in')
            ->where('reply_classification', 'interested')
            ->whereNotNull('in_reply_to')
            ->whereHas('parent', function (Builder $parent) use ($workspace, $from, $to): void {
                $parent
                    ->forWorkspace($workspace)
                    ->where('direction', 'out')
                    ->where(function (Builder $query) use ($from, $to): void {
                        $query
                            ->whereBetween('sent_at', [$from, $to])
                            ->orWhere(function (Builder $unsent) use ($from, $to): void {
                                $unsent->whereNull('sent_at')->whereBetween('created_at', [$from, $to]);
                            });
                    });
            })
        )->count();
        $campaignContactIds = (clone $out)->whereNotNull('campaign_id')->pluck('contact_id')->filter()->unique()->values();
        $openOpportunities = $campaignContactIds->isEmpty()
            ? 0
            : Deal::query()
                ->forWorkspace($workspace)
                ->whereIn('contact_id', $campaignContactIds)
                ->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false))
                ->count();
        $wonCustomers = $campaignContactIds->isEmpty()
            ? 0
            : Deal::query()
                ->forWorkspace($workspace)
                ->whereIn('contact_id', $campaignContactIds)
                ->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', true))
                ->select('contact_id')
                ->distinct()
                ->count();
        $demoRequests = $campaignContactIds->isEmpty()
            ? 0
            : FunnelEvent::query()
                ->forWorkspace($workspace)
                ->where('event_type', FunnelEvent::TYPE_DEMO_REQUESTED)
                ->whereBetween('occurred_at', [$from, $to])
                ->whereIn('contact_id', $campaignContactIds)
                ->select('contact_id')
                ->distinct()
                ->count();
        $demosBooked = $campaignContactIds->isEmpty()
            ? 0
            : FunnelEvent::query()
                ->forWorkspace($workspace)
                ->where('event_type', FunnelEvent::TYPE_MEETING_BOOKED)
                ->whereBetween('occurred_at', [$from, $to])
                ->whereIn('contact_id', $campaignContactIds)
                ->select('contact_id')
                ->distinct()
                ->count();
        $recipientAddresses = (clone $out)->pluck('to_address')->filter()->unique()->values();
        $optedOut = $recipientAddresses->isEmpty()
            ? 0
            : Suppression::query()
                ->forWorkspace($workspace)
                ->where('type', 'email')
                ->whereIn('value', $recipientAddresses)
                ->count();
        $metric = static fn (int $count, ?int $denominator, string $quality, string $source, string $definition, ?string $caveat = null): array => [
            'count' => $count,
            'denominator' => $denominator,
            'rate' => $denominator !== null && $denominator > 0 ? round($count / $denominator * 100, 2) : null,
            'quality' => $quality,
            'source' => $source,
            'definition' => $definition,
            'caveat' => $caveat,
        ];
        $tracking = [
            'selected' => $metric($selected, null, 'snapshot', 'campaign_audience', 'Sum of campaign audience snapshots; the same contact can be selected in more than one campaign.'),
            'attempted' => $metric($attempted, null, 'inferred', 'outbound_message_state', 'Outbound messages that left the queued state, including local eligibility or provider failures.'),
            'sent' => $metric($totals['sent'], $attempted, 'inferred', 'mailer_result', 'Messages whose configured mailer returned without an error; this is provider acceptance, not confirmed delivery.'),
            'delivered' => $metric($totals['delivered'], $totals['sent'], 'actual', 'provider_event', 'Messages with a recorded provider delivery event.'),
            'bounced' => $metric($totals['bounced'], $totals['sent'], 'actual', 'provider_event', 'Messages with a recorded bounce state or provider bounce event.'),
            'complained' => $metric($totals['complained'], $totals['sent'], 'actual', 'provider_event', 'Messages with a recorded provider complaint event.'),
            'replied' => $metric($totals['replied'], $totals['sent'], 'actual', 'reply_sync', 'Accepted outbound messages linked to an inbound reply.'),
            'positive_replies' => $metric($positiveReplies, $totals['replied'], 'inferred', 'reply_classification', 'Inbound replies classified as interested and linked to an outbound message.', 'Classification is operational triage and should be reviewed before treating it as a qualified opportunity.'),
            'opened' => $metric($totals['opened'], $totals['sent'], 'actual', 'first_party_tracking', 'Accepted outbound messages with at least one tracking-pixel event.', 'Opens are not reliable proof of interest.'),
            'clicked' => $metric($totals['clicked'], $totals['sent'], 'actual', 'first_party_tracking', 'Accepted outbound messages with at least one tracked-link event.', 'Clicks indicate a tracked interaction, not qualification.'),
            'qualified_opportunities' => $metric($openOpportunities, null, 'inferred', 'crm_pipeline', 'Open CRM deals for contacts reached by a campaign.', 'This is contact-attributed CRM state, not proof that the campaign created the opportunity; no conversion rate is shown.'),
            'demo_requests' => $metric($demoRequests, null, 'inferred', 'funnel_event', 'Distinct reached contacts with a recorded demo-requested funnel event.', 'Campaign attribution is contact-based; no conversion rate is shown.'),
            'demos_booked' => $metric($demosBooked, null, 'inferred', 'funnel_event', 'Distinct reached contacts with a recorded meeting-booked funnel event.', 'Campaign attribution is contact-based; no conversion rate is shown.'),
            'customers_won' => $metric($wonCustomers, null, 'inferred', 'crm_pipeline', 'Distinct contacts reached by a campaign with at least one won deal.', 'Campaign attribution is contact-based; no conversion rate is shown.'),
            'opted_out' => $metric($optedOut, $totals['sent'], 'actual', 'suppression_list', 'Unique recipient addresses currently present in the workspace email suppression list.'),
            'campaign_errors' => $metric($totals['failed'], $attempted, 'actual', 'outbound_message_state', 'Outbound messages in a failed state after leaving the queue.'),
        ];
        $perSequence = Sequence::query()
            ->forWorkspace($workspace)
            ->whereIn('id', (clone $out)->whereNotNull('sequence_id')->pluck('sequence_id')->filter()->unique())
            ->get()
            ->map(function (Sequence $sequence) use ($out, $from, $to): array {
                $messages = (clone $out)->where('sequence_id', $sequence->id);

                return [
                    'id' => $sequence->id,
                    'name' => $sequence->name,
                    'enrollments' => $sequence->enrollments()->whereBetween('created_at', [$from, $to])->count(),
                    'sent' => (clone $messages)->where('status', 'sent')->count(),
                    'opened' => (clone $messages)->whereNotNull('opened_at')->count(),
                    'replied' => (clone $messages)->whereNotNull('replied_at')->count(),
                ];
            });
        $campaignMessages = (clone $out)
            ->whereNotNull('campaign_id')
            ->get(['campaign_id', 'contact_id', 'status', 'deferred_until', 'replied_at', 'opened_at', 'clicked_at', 'delivered_at', 'complained_at', 'bounced_at']);
        $contactIds = $campaignMessages->pluck('contact_id')->filter()->unique()->values();
        $wonDealsByContact = $contactIds->isEmpty()
            ? collect()
            : Deal::query()
                ->forWorkspace($workspace)
                ->whereIn('contact_id', $contactIds)
                ->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', true))
                ->get(['id', 'contact_id', 'amount_cents'])
                ->groupBy('contact_id');
        $perCampaign = OutboundCampaign::query()
            ->forWorkspace($workspace)
            ->whereIn('id', $campaignIds)
            ->latest()
            ->limit(20)
            ->get()
            ->map(function (OutboundCampaign $campaign) use ($campaignMessages, $wonDealsByContact): array {
                $messages = $campaignMessages->where('campaign_id', $campaign->id);
                $campaignContactIds = $messages->pluck('contact_id')->filter()->unique();
                $wonDeals = $campaignContactIds
                    ->flatMap(fn ($contactId) => $wonDealsByContact->get($contactId, collect()))
                    ->unique('id');

                return array_merge([
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'audience_count' => $campaign->audience_count,
                    'won_deals' => $wonDeals->count(),
                    'won_revenue_cents' => (int) $wonDeals->sum('amount_cents'),
                    'queued' => $messages->where('status', 'queued')->count(),
                    'deferred' => $messages->where('status', 'queued')->filter(fn (OutboundMessage $message) => $message->deferred_until?->isFuture())->count(),
                    'sent' => $messages->where('status', 'sent')->count(),
                    'failed' => $messages->where('status', 'failed')->count(),
                    'opened' => $messages->whereNotNull('opened_at')->count(),
                    'clicked' => $messages->whereNotNull('clicked_at')->count(),
                    'replied' => $messages->whereNotNull('replied_at')->count(),
                    'delivered' => $messages->whereNotNull('delivered_at')->count(),
                    'complained' => $messages->whereNotNull('complained_at')->count(),
                    'bounced' => $messages->filter(fn (OutboundMessage $message) => $message->status === 'bounced' || $message->bounced_at !== null)->count(),
                ]);
            });
        $daily = (clone $out)->where('status', 'sent')->whereBetween('sent_at', [$from, $to])->selectRaw('DATE(sent_at) as day, COUNT(*) as sent')->groupBy('day')->orderBy('day')->get();

        return ['totals' => $totals, 'perSequence' => $perSequence, 'perCampaign' => $perCampaign, 'daily' => $daily, 'tracking' => $tracking];
    }

    /* ------------------------------------------------------------------ */
    /* Shared helpers */
    /* ------------------------------------------------------------------ */

    /**
     * A chart whose series carries no signal stays out of the payload —
     * the EvoViz renderer would return null for it anyway.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>|null
     */
    private function chart(array $payload): ?array
    {
        $hasSignal = collect($payload['series'] ?? [])
            ->flatMap(fn ($series) => $series['data'] ?? [])
            ->contains(fn ($value) => is_numeric($value) && $value != 0);

        return $hasSignal ? $payload : null;
    }

    /**
     * Product chrome only. Chart `labels` stay workspace data (stage names).
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function localizeChrome(array $payload): array
    {
        foreach (['title', 'description', 'label', 'hint', 'valueLabel'] as $field) {
            if (isset($payload[$field]) && is_string($payload[$field]) && $payload[$field] !== '') {
                $payload[$field] = __($payload[$field]);
            }
        }

        if (isset($payload['kpis']) && is_array($payload['kpis'])) {
            $payload['kpis'] = array_map(
                fn ($kpi) => is_array($kpi) ? $this->localizeChrome($kpi) : $kpi,
                $payload['kpis'],
            );
        }

        if (isset($payload['charts']) && is_array($payload['charts'])) {
            $payload['charts'] = array_map(
                fn ($chart) => is_array($chart) ? $this->localizeChart($chart) : $chart,
                $payload['charts'],
            );
        }

        if (isset($payload['table']['columns']) && is_array($payload['table']['columns'])) {
            $payload['table']['columns'] = array_map(
                fn ($column) => is_array($column) ? $this->localizeChrome($column) : $column,
                $payload['table']['columns'],
            );
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $chart
     * @return array<string, mixed>
     */
    private function localizeChart(array $chart): array
    {
        $chart = $this->localizeChrome($chart);

        if (isset($chart['series']) && is_array($chart['series'])) {
            $chart['series'] = array_map(function ($series) {
                if (is_array($series) && isset($series['name']) && is_string($series['name'])) {
                    $series['name'] = __($series['name']);
                }

                return $series;
            }, $chart['series']);
        }

        if (($chart['labels'] ?? null) === ['Won', 'Lost']) {
            $chart['labels'] = [__('Won'), __('Lost')];
        }

        return $chart;
    }

    private function inWindow(?CarbonInterface $date, CarbonInterface $from, CarbonInterface $to): bool
    {
        return $date !== null && $date->betweenIncluded($from, $to);
    }

    /**
     * Bucket datetimes into each Algiers day of the window, oldest first.
     * With $weights, each date contributes its weight instead of a count.
     *
     * @param  Collection<int, CarbonInterface|null>  $dates
     * @param  Collection<int, int|float>|null  $weights
     * @return array{0: array<int, string>, 1: array<int, int>}
     */
    private function dailySeries(Collection $dates, CarbonInterface $from, CarbonInterface $to, ?Collection $weights = null): array
    {
        $days = collect();
        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day = $day->addDay()) {
            $days->push($day->toDateString());
        }

        $sums = collect();
        $dates->values()->each(function (?CarbonInterface $date, $i) use ($sums, $weights) {
            if ($date === null) {
                return;
            }

            $key = $date->copy()->setTimezone(self::TZ)->toDateString();
            $sums[$key] = ($sums[$key] ?? 0) + ($weights ? (float) ($weights[$i] ?? 1) : 1);
        });

        return [
            $days->map(fn (string $day) => Carbon::parse($day)->format('d/m'))->all(),
            $days->map(fn (string $day) => (int) round($sums[$day] ?? 0))->all(),
        ];
    }

    private function dzd(int|float $cents): string
    {
        return number_format($cents / 100, 0, ',', ' ').' DA';
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function constrainOwner(Builder $query, string $column = 'owner_id'): Builder
    {
        if ($this->ownerId !== null) {
            $query->where($column, $this->ownerId);
        }

        return $query;
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function constrainContactOwner(Builder $query): Builder
    {
        if ($this->ownerId !== null) {
            $query->whereHas('contact', fn (Builder $contact) => $contact->where('owner_id', $this->ownerId));
        }

        return $query;
    }

    /**
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<string, mixed>|null
     */
    private function presentDashboard(?Dashboard $dashboard, array $categories): ?array
    {
        if ($dashboard === null) {
            return null;
        }

        $chartsByRoom = collect($categories)->mapWithKeys(
            fn (array $category) => [
                $category['key'] => collect($category['charts'] ?? [])->keyBy('id'),
            ],
        );

        $widgets = collect($dashboard->widgetKeys())
            ->map(function (string $key) use ($chartsByRoom) {
                $meta = ReportWidgets::get($key);

                if ($meta === null) {
                    return null;
                }

                return [
                    'key' => $key,
                    'title' => __($meta['title']),
                    'room' => $meta['room'],
                    'chart' => $chartsByRoom[$meta['room']][$meta['id']] ?? null,
                ];
            })
            ->filter()
            ->values()
            ->all();

        return [
            'id' => $dashboard->id,
            'name' => $dashboard->name,
            'owner' => [
                'id' => $dashboard->owner_id,
                'name' => $dashboard->owner?->name,
            ],
            'widgets' => $widgets,
        ];
    }
}
