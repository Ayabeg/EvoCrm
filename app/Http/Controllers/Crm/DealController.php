<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Stage;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'stage_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'source' => ['nullable', 'string', 'max:80'],
            'close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:180'],
        ]);

        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline();
        $stage = filled($data['stage_id'] ?? null)
            ? Stage::query()->where('pipeline_id', $pipeline->id)->findOrFail($data['stage_id'])
            : $pipeline->stageBySlug('new');

        $contact = Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);

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

        return Inertia::render('crm/deals/hub', [
            'deals' => $deals,
            'selected' => $selected?->load(['contact.company', 'company', 'stage', 'pipeline.stages', 'lead', 'owner', 'quotes.items']),
            'associations' => $selected ? $hub->dealAssociations($selected) : null,
            'timeline' => $selected ? $hub->timeline(deal: $selected) : [],
            'attributes' => $selected ? $hub->attributeBag($workspace, 'deal', $selected->id) : ['definitions' => [], 'values' => []],
            'stages' => $pipeline->stages,
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
