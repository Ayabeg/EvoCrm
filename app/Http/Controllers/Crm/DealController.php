<?php

namespace App\Http\Controllers\Crm;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealHealthSnapshot;
use App\Models\DealStageApproval;
use App\Models\DealSuggestion;
use App\Models\Pipeline;
use App\Models\Product;
use App\Models\Stage;
use App\Models\Workspace;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Services\Crm\DealAttentionEvaluator;
use App\Services\Crm\DealBoardOptions;
use App\Services\Crm\PipelineManager;
use App\Services\Crm\StagePropertyGate;
use App\Services\LeadOs\DealHealthScorer;
use App\Services\LeadOs\NextMoveAdvisor;
use App\Services\Operations\AuditLogger;
use App\Support\CrmHub;
use App\Support\CsvExport;
use App\Support\StageCopy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DealController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub, PipelineManager $pipelines, RecordInsight $insight, DealAttentionEvaluator $attention): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $pipelines->resolve($workspace, $request->integer('pipeline') ?: null);
        $filters = $filter->resolve($request, $workspace, 'deal');

        $teamOnly = $request->user()->role === WorkspaceRole::Member
            && $request->user()->canPermission('deals.team_only');

        if ($teamOnly || ($filters['view'] ?? 'all') === 'mine') {
            $filters['owner'] = (string) $request->user()->id;
        }

        $query = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->with(['contact.company', 'company', 'stage', 'owner']);

        $filter->apply('deal', $query, $filters);
        $filter->applySort('deal', $query, $filters);

        [$dealRows, $paginator] = $filter->paginate($query, $request);
        $deals = $hub->withListAttributes($workspace, 'deal', $dealRows);

        $nextByDeal = Activity::query()
            ->whereIn('deal_id', $dealRows->pluck('id'))
            ->whereIn('type', ['meeting', 'task'])
            ->where('done', false)
            ->whereNotNull('due_at')
            ->orderBy('due_at')
            ->get()
            ->unique('deal_id')
            ->keyBy('deal_id');

        $attentions = $attention->presentMany($dealRows);

        $deals = collect($deals)->map(function (array $row) use ($insight, $dealRows, $nextByDeal, $attention, $attentions) {
            $model = $dealRows->firstWhere('id', $row['id']);
            $health = $model ? $insight->dealHealth($model) : null;
            $next = $nextByDeal->get($row['id']);

            $nextLabel = null;
            if ($next) {
                $when = $next->due_at?->timezone('Africa/Algiers')->format('d M H:i');
                $nextLabel = trim(($next->subject ?: ucfirst($next->type)).($when ? ' · '.$when : ''));
            } elseif ($health['next_action'] ?? null) {
                $nextLabel = $health['next_action'];
            }

            return [
                ...$row,
                'health' => $health ? [
                    'score' => $health['score'],
                    'band' => $health['band'],
                    'label' => $health['label'],
                ] : null,
                'next_step' => $nextLabel,
                'attention' => $model ? $attention->compact($attentions[(int) $model->id] ?? null) : null,
            ];
        })->values()->all();

        $stageCounts = $pipeline->stages->map(function (Stage $stage) use ($workspace, $filters, $filter) {
            $countQuery = Deal::query()->forWorkspace($workspace);
            $countFilters = $filters;
            unset($countFilters['stage']);
            $filter->apply('deal', $countQuery, $countFilters);

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'count' => (clone $countQuery)->where('stage_id', $stage->id)->count(),
            ];
        })->values();

        $openQuery = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

        if ($teamOnly) {
            $openQuery->where('owner_id', $request->user()->id);
        }

        $forecast = $pipelines->forecast($workspace, $pipeline);
        $openCents = $openQuery->sum('amount_cents');

        return Inertia::render('crm/deals/index', [
            'deals' => $deals,
            'stages' => $pipeline->stages,
            'stageCounts' => $stageCounts,
            'pipeline' => $pipeline->only(['id', 'name']),
            'pipelines' => $pipelines->options($workspace)->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'is_default' => (bool) $row->is_default,
            ])->values(),
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'deal', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('deal', $filters['columns'] ?? null, $filters['sort'] ?? null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'stagePills' => $stageCounts,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'openPipelineCents' => $openCents,
            'forecast' => $forecast,
            'createOpen' => $request->boolean('create'),
            'prefillContactId' => $request->integer('contact_id') ?: null,
            'attentionQueue' => $this->attentionQueue($workspace, $pipeline, $filters, $filter, $attention, $teamOnly),
            'bulk' => [
                'enabled' => $request->user()->canPermission('crm.bulk'),
            ],
        ]);
    }

    public function board(Request $request, PipelineManager $pipelines, DealBoardOptions $boardOptions, CrmFilter $filter, CrmHub $hub, DealAttentionEvaluator $attention): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $pipelines->resolve($workspace, $request->integer('pipeline') ?: null);
        $filters = $filter->resolve($request, $workspace, 'deal');

        $teamOnly = $request->user()->role === WorkspaceRole::Member
            && $request->user()->canPermission('deals.team_only');

        if ($teamOnly || ($filters['view'] ?? 'all') === 'mine') {
            $filters['owner'] = (string) $request->user()->id;
        }

        $options = $boardOptions->forUser($request->user());
        $board = $pipelines->boardData(
            $workspace,
            $pipeline,
            $options,
            function ($query) use ($filter, $filters): void {
                $filter->apply('deal', $query, $filters);
            },
        );

        $stagePills = $pipeline->stages->map(function (Stage $stage) use ($workspace, $pipeline, $filters, $filter) {
            $countQuery = Deal::query()
                ->forWorkspace($workspace)
                ->where('pipeline_id', $pipeline->id);
            $countFilters = $filters;
            unset($countFilters['stage']);
            $filter->apply('deal', $countQuery, $countFilters);

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'count' => (clone $countQuery)->where('stage_id', $stage->id)->count(),
            ];
        })->values();

        return Inertia::render('crm/deals/board', [
            'pipeline' => $pipeline->only(['id', 'name']),
            'pipelines' => $pipelines->options($workspace)->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'is_default' => (bool) $row->is_default,
            ])->values(),
            'stages' => $board['stages'],
            'deals' => $board['deals'],
            'forecast' => $board['forecast'],
            'forecastBand' => app(RecordInsight::class)->pipelineForecastBand($workspace, $pipeline),
            'forecastBacktest' => app(RecordInsight::class)->pipelineForecastBacktest($workspace, $pipeline),
            'boardOptions' => $options,
            'savedFilters' => $hub->filters($workspace, 'deal', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('deal', $filters['columns'] ?? null, $filters['sort'] ?? null, $workspace),
            'members' => $hub->members($workspace),
            'recordCount' => count($board['deals']),
            'stagePills' => $stagePills,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'attentionQueue' => $this->attentionQueue($workspace, $pipeline, $filters, $filter, $attention, $teamOnly),
        ]);
    }

    public function updateBoardOptions(Request $request, DealBoardOptions $boardOptions): RedirectResponse
    {
        $data = $request->validate([
            'card_style' => ['required', 'in:default,compact'],
            'inactive_after_days' => ['required', 'integer', 'min:1', 'max:90'],
            'sort' => ['required', 'in:last_activity,amount,close_date,title'],
        ]);

        $boardOptions->save($request->user(), [
            ...$data,
            'show_priority' => $request->boolean('show_priority'),
            'show_associations' => $request->boolean('show_associations'),
            'show_activity' => $request->boolean('show_activity'),
            'mark_inactive' => $request->boolean('mark_inactive'),
        ]);

        return back();
    }

    public function show(Request $request, Deal $deal, CrmHub $hub, RecordInsight $insight, DealHealthScorer $health, NextMoveAdvisor $moves): Response
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $deal->load(['contact.company', 'company', 'stage', 'pipeline.stages', 'lead', 'owner', 'quotes.items', 'lineItems.product', 'splits.user']);
        $snapshot = $health->latestFor($deal);
        $nextMove = $moves->latestPending($deal);
        $afterTouch = $moves->latestPending($deal, DealSuggestion::KIND_AFTER_TOUCH);
        $lostReason = $moves->latestPending($deal, DealSuggestion::KIND_LOST_REASON);
        $stageApprovals = DealStageApproval::query()
            ->forWorkspace($workspace)
            ->where('deal_id', $deal->id)
            ->with(['stage', 'requestedBy:id,name', 'approvedBy:id,name'])
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (DealStageApproval $approval): array => [
                'id' => $approval->id,
                'stage' => $approval->stage?->name,
                'status' => $approval->status,
                'note' => $approval->note,
                'requested_by' => $approval->requestedBy?->name,
                'approved_by' => $approval->approvedBy?->name,
                'requested_at' => $approval->requested_at?->toIso8601String(),
                'decided_at' => $approval->decided_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return Inertia::render('crm/deals/show', [
            'deal' => $deal,
            'selected' => $deal,
            'associations' => $hub->dealAssociations($deal),
            'timeline' => $hub->timeline(deal: $deal),
            'catchUp' => $hub->catchUp(deal: $deal),
            'attributes' => $hub->attributeBag($workspace, 'deal', $deal->id),
            'playbooks' => $hub->playbooks($workspace, 'deal'),
            'stages' => StageCopy::sort($deal->pipeline?->stages ?? $workspace->defaultPipeline()->stages),
            'members' => $hub->members($workspace),
            'products' => Product::query()->forWorkspace($workspace)->orderBy('name')->get(),
            'splits' => $deal->splits,
            'canManageSplits' => $request->user()->role->canManageSettings(),
            'dealHealth' => $snapshot instanceof DealHealthSnapshot
                ? $snapshot->present()
                : $insight->dealHealth($deal),
            'nextMove' => $nextMove?->present(),
            'afterTouch' => $afterTouch?->present(),
            'lostReason' => $lostReason?->present(),
            'stageApprovals' => $stageApprovals,
            'canApproveStage' => $request->user()->role->canManageSettings(),
            'askEvo' => $insight->forDeal($deal),
        ]);
    }

    public function store(Request $request, ContactIdentity $identity): RedirectResponse
    {
        $this->authorize('create', Deal::class);

        $data = $request->validate([
            'contact_id' => ['nullable', 'integer'],
            'contact_name' => ['nullable', 'string', 'max:180'],
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'stage_id' => ['nullable', 'integer'],
            'pipeline_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'source' => ['nullable', 'string', 'max:80'],
            'type' => ['nullable', 'string', 'max:40'],
            'priority' => ['nullable', 'string', 'max:40'],
            'close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:180'],
            'add_another' => ['sometimes', 'boolean'],
        ]);

        $workspace = $request->user()->workspace;
        $pipeline = app(PipelineManager::class)->resolve(
            $workspace,
            filled($data['pipeline_id'] ?? null) ? (int) $data['pipeline_id'] : null,
        );
        $stage = filled($data['stage_id'] ?? null)
            ? Stage::query()->where('pipeline_id', $pipeline->id)->findOrFail($data['stage_id'])
            : $pipeline->stageBySlug('new');

        $contact = filled($data['contact_id'] ?? null)
            ? Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id'])
            : $identity->findOrCreate($workspace, [
                'first_name' => filled($data['contact_name'] ?? null)
                    ? Str::before($data['contact_name'], ' ')
                    : $data['title'],
                'last_name' => filled($data['contact_name'] ?? null) && filled(Str::after($data['contact_name'], ' '))
                    ? Str::after($data['contact_name'], ' ')
                    : null,
                'source' => 'deal',
            ]);

        $deal = new Deal([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $pipeline->stageBySlug('new')?->id,
            'owner_id' => $data['owner_id'] ?? $request->user()->id,
            'title' => $data['title'],
            'amount_cents' => $this->toCents($data),
            'currency' => 'DZD',
            'source' => $data['source'] ?? 'manual',
            'type' => $data['type'] ?? null,
            'priority' => $data['priority'] ?? null,
            'close_date' => $data['close_date'] ?? null,
            'next_step' => $data['next_step'] ?? null,
        ]);

        app(StagePropertyGate::class)->assertCanEnter($deal, $stage);
        $deal->stage_id = $stage->id;
        $deal->save();

        return $request->boolean('add_another')
            ? redirect()->route('crm.deals.index', ['create' => 1])
            : redirect()->route('crm.deals.index');
    }

    public function update(Request $request, Deal $deal, CustomAttributes $attributes): RedirectResponse
    {
        $this->authorize('update', $deal);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'next_activity_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer'],
            'source' => ['nullable', 'string', 'max:80'],
            'type' => ['nullable', 'string', 'max:40'],
            'priority' => ['nullable', 'string', 'max:40'],
            'lost_reason' => ['nullable', 'string', 'max:180'],
            'close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:180'],
            'attributes' => ['nullable', 'array'],
        ]);

        $deal->update([
            'title' => $data['title'],
            'amount_cents' => $deal->lineItems()->exists()
                ? (int) $deal->amount_cents
                : $this->toCents($data, (int) $deal->amount_cents),
            'next_activity_at' => $data['next_activity_at'] ?? $deal->next_activity_at,
            'owner_id' => array_key_exists('owner_id', $data) ? $data['owner_id'] : $deal->owner_id,
            'source' => $data['source'] ?? $deal->source,
            'type' => array_key_exists('type', $data) ? $data['type'] : $deal->type,
            'priority' => array_key_exists('priority', $data) ? $data['priority'] : $deal->priority,
            'lost_reason' => $data['lost_reason'] ?? $deal->lost_reason,
            'close_date' => $data['close_date'] ?? $deal->close_date,
            'next_step' => $data['next_step'] ?? $deal->next_step,
        ]);

        if (isset($data['attributes'])) {
            $attributes->saveValues($request->user()->workspace, 'deal', $deal->id, $data['attributes']);
        }

        return back();
    }

    public function export(Request $request, CrmFilter $filter, PipelineManager $pipelines): StreamedResponse
    {
        $workspace = $request->user()->workspace;
        $pipeline = $pipelines->resolve($workspace, $request->integer('pipeline') ?: null);
        $filters = $filter->resolve($request, $workspace, 'deal');

        $query = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->with(['contact', 'company', 'owner', 'stage']);

        $filter->apply('deal', $query, $filters);

        return response()->streamDownload(function () use ($query): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'title', 'amount_cents', 'currency', 'stage', 'contact', 'company', 'owner', 'source', 'close_date', 'created_at']);

            $query->orderBy('title')->each(function (Deal $deal) use ($out): void {
                fputcsv($out, CsvExport::row([
                    $deal->id,
                    $deal->title,
                    $deal->amount_cents,
                    $deal->currency,
                    $deal->stage?->name,
                    $deal->contact?->displayName(),
                    $deal->company?->name,
                    $deal->owner?->name,
                    $deal->source,
                    $deal->close_date?->toDateString(),
                    $deal->created_at?->toDateTimeString(),
                ]));
            });

            fclose($out);
        }, 'deals-'.now()->toDateString().'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function updateAttributes(Request $request, Deal $deal, CustomAttributes $attributes): RedirectResponse
    {
        $this->authorize('update', $deal);

        $data = $request->validate([
            'attributes' => ['required', 'array'],
        ]);

        $attributes->saveValues(
            $request->user()->workspace,
            'deal',
            $deal->id,
            $data['attributes'],
            enforceRequired: true,
        );

        return back();
    }

    public function move(Request $request, Deal $deal): RedirectResponse
    {
        $this->authorize('move', $deal);

        $data = $request->validate([
            'stage_id' => ['required', 'integer'],
            'lost_reason' => ['nullable', 'string', 'max:180'],
        ]);

        $stage = Stage::query()->where('pipeline_id', $deal->pipeline_id)->findOrFail($data['stage_id']);

        if ($stage->is_lost && filled($data['lost_reason'] ?? null)) {
            $deal->lost_reason = $data['lost_reason'];
        }

        $deal->moveTo($stage, $request->user());

        return back();
    }

    public function approveStage(Request $request, Deal $deal, DealStageApproval $approval, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()->role->canManageSettings(), 403);
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $approval->workspace_id === (int) $deal->workspace_id && (int) $approval->deal_id === (int) $deal->id, 404);

        $approval->approve($request->user());
        $audit->record(
            $request->user()->workspace,
            'deal.stage_approval_approved',
            'Approved deal stage transition',
            $request->user(),
            $deal,
            ['approval_id' => $approval->id, 'stage_id' => $approval->stage_id],
            $request->ip(),
        );

        return back();
    }

    public function rejectStage(Request $request, Deal $deal, DealStageApproval $approval, AuditLogger $audit): RedirectResponse
    {
        abort_unless($request->user()->role->canManageSettings(), 403);
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $approval->workspace_id === (int) $deal->workspace_id && (int) $approval->deal_id === (int) $deal->id, 404);

        $data = $request->validate(['note' => ['nullable', 'string', 'max:500']]);
        $approval->reject($request->user(), $data['note'] ?? null);
        $audit->record(
            $request->user()->workspace,
            'deal.stage_approval_rejected',
            'Rejected deal stage transition',
            $request->user(),
            $deal,
            ['approval_id' => $approval->id, 'stage_id' => $approval->stage_id],
            $request->ip(),
        );

        return back();
    }

    /**
     * Compact Needs Attention queue. Same evaluator as List/Board.
     * Composes with the current workspace slice; always needs_attention.
     *
     * @param  array<string, mixed>  $filters
     * @return list<array{id: int, title: string, href: string, primary: array<string, mixed>}>
     */
    protected function attentionQueue(
        Workspace $workspace,
        Pipeline $pipeline,
        array $filters,
        CrmFilter $filter,
        DealAttentionEvaluator $attention,
        bool $teamOnly,
    ): array {
        $queueFilters = $filters;
        $queueFilters['attention'] = DealAttentionEvaluator::FILTER_NEEDS_ATTENTION;

        $query = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id);

        if ($teamOnly) {
            $query->where('owner_id', $filters['owner'] ?? null);
        }

        $filter->apply('deal', $query, $queueFilters);

        return $attention->queue($query);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function toCents(array $data, int $fallback = 0): int
    {
        if (array_key_exists('amount_cents', $data) && $data['amount_cents'] !== null) {
            return (int) $data['amount_cents'];
        }

        if (array_key_exists('amount_dzd', $data) && $data['amount_dzd'] !== null) {
            return (int) round(((float) $data['amount_dzd']) * 100);
        }

        return $fallback;
    }
}
