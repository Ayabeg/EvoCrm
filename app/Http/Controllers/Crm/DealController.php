<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Stage;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
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
        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline()->load('stages');
        $filters = $filter->resolve($request, $workspace, 'deal');

        if (($filters['view'] ?? 'all') === 'mine') {
            $filters['owner'] = (string) $request->user()->id;
        }

        $query = Deal::query()
            ->forWorkspace($workspace)
            ->with(['contact.company', 'company', 'stage', 'owner']);

        $filter->applyToDeals($query, $filters);
        $filter->applySort('deal', $query, $filters);

        $deals = $query->limit(120)->get();

        $stageCounts = $pipeline->stages->map(function (Stage $stage) use ($workspace, $filters, $filter) {
            $countQuery = Deal::query()->forWorkspace($workspace);
            $countFilters = $filters;
            unset($countFilters['stage']);
            $filter->applyToDeals($countQuery, $countFilters);

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'count' => (clone $countQuery)->where('stage_id', $stage->id)->count(),
            ];
        })->values();

        $openCents = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false))
            ->sum('amount_cents');

        return Inertia::render('crm/deals/index', [
            'deals' => $deals,
            'stages' => $pipeline->stages,
            'stageCounts' => $stageCounts,
            'pipeline' => $pipeline->only(['id', 'name']),
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'deal', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('deal', $filters['columns'] ?? null, $filters['sort'] ?? null),
            'recordCount' => $filter->count($workspace, 'deal', $filters),
            'stagePills' => $stageCounts,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'openPipelineCents' => $openCents,
            'createOpen' => $request->boolean('create'),
        ]);
    }

    public function show(Request $request, Deal $deal, CrmHub $hub): Response
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $deal->load(['contact.company', 'company', 'stage', 'pipeline.stages', 'lead', 'owner', 'quotes.items']);

        return Inertia::render('crm/deals/show', [
            'deal' => $deal,
            'associations' => $hub->dealAssociations($deal),
            'timeline' => $hub->timeline(deal: $deal),
            'attributes' => $hub->attributeBag($workspace, 'deal', $deal->id),
            'stages' => $deal->pipeline?->stages ?? $workspace->defaultPipeline()->stages,
            'members' => $hub->members($workspace),
        ]);
    }

    public function store(Request $request, ContactIdentity $identity): RedirectResponse
    {
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
        $pipeline = $workspace->defaultPipeline();
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
            'type' => $data['type'] ?? null,
            'priority' => $data['priority'] ?? null,
            'close_date' => $data['close_date'] ?? null,
            'next_step' => $data['next_step'] ?? null,
        ]);

        return $request->boolean('add_another')
            ? redirect()->route('crm.deals.index', ['create' => 1])
            : redirect()->route('crm.deals.index');
    }

    public function update(Request $request, Deal $deal, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

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
            'amount_cents' => $this->toCents($data, (int) $deal->amount_cents),
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
