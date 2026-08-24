<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Product;
use App\Models\Stage;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Services\Crm\DealBoardForecast;
use App\Services\Crm\DealLineTotals;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        return $this->hub($request, $filter, $hub, null);
    }

    public function show(Request $request, Deal $deal, CrmFilter $filter, CrmHub $hub): Response
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        return $this->hub($request, $filter, $hub, $deal);
    }

    public function store(Request $request, ContactIdentity $identity): RedirectResponse
    {
        $data = $request->validate([
            'contact_id' => ['required_without:contact_name', 'nullable', 'integer'],
            'contact_name' => ['required_without:contact_id', 'nullable', 'string', 'max:180'],
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'stage_id' => ['nullable', 'integer'],
            'pipeline_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'source' => ['nullable', 'string', 'max:80'],
            'close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:180'],
        ]);

        $workspace = $request->user()->workspace;
        $pipeline = filled($data['pipeline_id'] ?? null)
            ? Pipeline::query()->forWorkspace($workspace)->findOrFail($data['pipeline_id'])
            : $workspace->defaultPipeline();
        $stage = filled($data['stage_id'] ?? null)
            ? Stage::query()->where('pipeline_id', $pipeline->id)->findOrFail($data['stage_id'])
            : $pipeline->stageBySlug('new');

        // Kommo-style quick-add: a bare contact name creates the person inline.
        $contact = filled($data['contact_id'] ?? null)
            ? Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id'])
            : $identity->findOrCreate($workspace, [
                'first_name' => Str::before($data['contact_name'], ' '),
                'last_name' => filled(Str::after($data['contact_name'], ' ')) ? Str::after($data['contact_name'], ' ') : null,
                'source' => 'quick_add',
            ]);

        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'owner_id' => $data['owner_id'] ?? $request->user()->id,
            'title' => $data['title'],
            'amount_cents' => $this->toCents($data),
            'currency' => 'DZD',
            'source' => $data['source'] ?? 'manual',
            'close_date' => $data['close_date'] ?? null,
            'next_step' => $data['next_step'] ?? null,
        ]);

        return back();
    }

    public function update(Request $request, Deal $deal, CustomAttributes $attributes, DealLineTotals $lineTotals): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'next_activity_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer'],
            'source' => ['nullable', 'string', 'max:80'],
            'lost_reason' => ['nullable', 'string', 'max:180'],
            'close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:180'],
            'attributes' => ['nullable', 'array'],
        ]);

        $amount = $deal->lineItems()->exists()
            ? (int) $deal->amount_cents
            : $this->toCents($data, (int) $deal->amount_cents);

        $deal->update([
            'title' => $data['title'],
            'amount_cents' => $amount,
            'next_activity_at' => $data['next_activity_at'] ?? $deal->next_activity_at,
            'owner_id' => array_key_exists('owner_id', $data) ? $data['owner_id'] : $deal->owner_id,
            'source' => $data['source'] ?? $deal->source,
            'lost_reason' => $data['lost_reason'] ?? $deal->lost_reason,
            'close_date' => $data['close_date'] ?? $deal->close_date,
            'next_step' => $data['next_step'] ?? $deal->next_step,
        ]);

        $lineTotals->rollup($deal);

        if (isset($data['attributes'])) {
            $attributes->saveValues($request->user()->workspace, 'deal', $deal->id, $data['attributes']);
        }

        return back();
    }

    public function updateAttributes(Request $request, Deal $deal, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

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
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

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

    public function board(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $pipelines = $workspace->pipelines()->orderByDesc('is_default')->orderBy('name')->get();

        $requestedId = $request->integer('pipeline');
        $pipeline = $requestedId > 0
            ? $pipelines->firstWhere('id', $requestedId)
            : $pipelines->firstWhere('is_default', true) ?? $pipelines->first();

        abort_unless($pipeline instanceof Pipeline, 404);

        $pipeline->load('stages');

        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->with(['contact.company', 'company', 'stage', 'owner'])
            ->orderByDesc('last_activity_at')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        $stages = $pipeline->stages->map(function (Stage $stage) use ($deals) {
            $column = $deals->where('stage_id', $stage->id);
            $amountCents = (int) $column->sum('amount_cents');
            $probability = $stage->winProbability();

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'position' => $stage->position,
                'is_won' => $stage->is_won,
                'is_lost' => $stage->is_lost,
                'probability' => $probability,
                'count' => $column->count(),
                'amount_cents' => $amountCents,
                'weighted_cents' => DealBoardForecast::weightedCents($amountCents, $probability),
            ];
        })->values();

        return Inertia::render('crm/deals/board', [
            'pipeline' => [
                'id' => $pipeline->id,
                'name' => $pipeline->name,
            ],
            'pipelines' => $pipelines->map(fn (Pipeline $row) => [
                'id' => $row->id,
                'name' => $row->name,
                'is_default' => $row->is_default,
            ])->values(),
            'stages' => $stages,
            'deals' => $deals->map(fn (Deal $deal) => [
                'id' => $deal->id,
                'title' => $deal->title,
                'amount_cents' => (int) $deal->amount_cents,
                'currency' => $deal->currency ?? 'DZD',
                'stage_id' => $deal->stage_id,
                'contact_name' => $deal->contact?->displayName(),
                'company_name' => $deal->company?->name ?? $deal->contact?->company?->name,
                'owner_name' => $deal->owner?->name,
                'close_date' => $deal->close_date?->toDateString(),
                'url' => "/crm/deals/{$deal->id}",
            ])->values(),
            'forecast' => [
                'count' => $deals->count(),
                'amount_cents' => (int) $stages->sum('amount_cents'),
                'weighted_cents' => (int) $stages->sum('weighted_cents'),
            ],
        ]);
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

    protected function hub(Request $request, CrmFilter $filter, CrmHub $hub, ?Deal $selected): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline()->load('stages');
        $filters = $filter->resolve($request, $workspace, 'deal');

        $query = Deal::query()
            ->forWorkspace($workspace)
            ->with(['contact.company', 'company', 'stage', 'owner']);

        $filter->applyToDeals($query, $filters);

        $deals = $query->orderByDesc('last_activity_at')->orderByDesc('id')->limit(120)->get();

        if (! $selected && $request->integer('deal')) {
            $selected = Deal::query()->forWorkspace($workspace)->find($request->integer('deal'));
        }

        $selected ??= $deals->first();

        $openCents = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false))
            ->sum('amount_cents');

        $stagePills = $pipeline->stages->map(function (Stage $stage) use ($workspace, $filter, $filters) {
            $countQuery = Deal::query()->forWorkspace($workspace)->where('stage_id', $stage->id);
            $withoutStage = $filters;
            $withoutStage['stage'] = null;
            $filter->applyToDeals($countQuery, $withoutStage);

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'count' => $countQuery->count(),
                'tone' => $stage->is_won ? 'won' : ($stage->is_lost ? 'lost' : 'open'),
            ];
        })->values();

        return Inertia::render('crm/deals/hub', [
            'deals' => $deals,
            'selected' => $selected?->load(['contact.company', 'company', 'stage', 'pipeline.stages', 'lead', 'owner', 'quotes.items', 'lineItems.product']),
            'associations' => $selected ? $hub->dealAssociations($selected) : null,
            'products' => Product::query()
                ->forWorkspace($workspace)
                ->active()
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'unit_cents', 'currency', 'active']),
            'timeline' => $selected ? $hub->timeline(deal: $selected) : [],
            'catchUp' => $selected ? $hub->catchUp(deal: $selected) : ['inbound' => [], 'outbound' => []],
            'attributes' => $selected ? $hub->attributeBag($workspace, 'deal', $selected->id) : ['definitions' => [], 'values' => []],
            'stages' => $pipeline->stages,
            'stagePills' => $stagePills,
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'deal'),
            'activeFilters' => $filters,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'openPipelineCents' => $openCents,
        ]);
    }
}
