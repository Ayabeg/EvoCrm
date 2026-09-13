<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\EnrichmentRun;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Services\Enrichment\EnrichmentService;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'company');

        if (($filters['view'] ?? 'all') === 'mine') {
            $filters['owner'] = (string) $request->user()->id;
        }

        $query = Company::query()
            ->forWorkspace($workspace)
            ->with('owner')
            ->withCount(['contacts', 'deals']);

        $filter->apply('company', $query, $filters);
        $filter->applySort('company', $query, $filters);

        [$companyRows, $paginator] = $filter->paginate($query, $request);

        return Inertia::render('crm/companies/index', [
            'companies' => $hub->withListAttributes($workspace, 'company', $companyRows),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'company', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('company', $filters['columns'] ?? null, $filters['sort'] ?? null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'createOpen' => $request->boolean('create'),
        ]);
    }

    public function show(Request $request, Company $company, CrmHub $hub, RecordInsight $insight, EnrichmentService $enrichment): Response
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $company->load(['owner', 'contacts', 'deals.stage']);
        $company->loadCount('contacts');

        return Inertia::render('crm/companies/show', [
            'company' => $company,
            'selected' => $company,
            'associations' => $hub->companyAssociations($company),
            'timeline' => $hub->timeline(company: $company),
            'attributes' => $hub->attributeBag($workspace, 'company', $company->id),
            'members' => $hub->members($workspace),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'askEvo' => $insight->forCompany($company),
            'enrichmentRuns' => $enrichment->history($workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id),
            'enrichAction' => "/crm/companies/{$company->id}/enrich",
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Company::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'domain' => ['nullable', 'string', 'max:180'],
            'industry' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:120'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'owner_id' => ['nullable', 'integer'],
            'add_another' => ['sometimes', 'boolean'],
        ]);

        Company::query()->create([
            ...collect($data)->except('add_another')->all(),
            'workspace_id' => $request->user()->workspace_id,
            'country' => 'DZ',
        ]);

        return $request->boolean('add_another')
            ? redirect()->route('crm.companies.index', ['create' => 1])
            : redirect()->route('crm.companies.index');
    }

    public function update(Request $request, Company $company, CustomAttributes $attributes): RedirectResponse
    {
        $this->authorize('update', $company);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'domain' => ['nullable', 'string', 'max:180'],
            'industry' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:120'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string'],
            'owner_id' => ['nullable', 'integer'],
            'attributes' => ['nullable', 'array'],
        ]);

        $values = $data['attributes'] ?? [];
        unset($data['attributes']);
        $company->update($data);

        if ($values !== []) {
            $attributes->saveValues($request->user()->workspace, 'company', $company->id, $values);
        }

        return back();
    }
}
