<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        return $this->hub($request, $filter, $hub, null);
    }

    public function show(Request $request, Company $company, CrmFilter $filter, CrmHub $hub): Response
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        return $this->hub($request, $filter, $hub, $company);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'domain' => ['nullable', 'string', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:120'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'owner_id' => ['nullable', 'integer'],
        ]);

        Company::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
            'country' => 'DZ',
        ]);

        return back();
    }

    public function update(Request $request, Company $company, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'domain' => ['nullable', 'string', 'max:180'],
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

    public function updateAttributes(Request $request, Company $company, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'attributes' => ['required', 'array'],
        ]);

        $attributes->saveValues(
            $request->user()->workspace,
            'company',
            $company->id,
            $data['attributes'],
            enforceRequired: true,
        );

        return back();
    }

    protected function hub(Request $request, CrmFilter $filter, CrmHub $hub, ?Company $selected): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'company');

        $query = Company::query()
            ->forWorkspace($workspace)
            ->with('owner')
            ->withCount(['contacts', 'deals']);

        $filter->apply('company', $query, $filters);
        $filter->applySort('company', $query, $filters);

        $companies = $query
            ->orderBy('name')
            ->limit(120)
            ->get();

        if (! $selected && $request->integer('company')) {
            $selected = Company::query()->forWorkspace($workspace)->find($request->integer('company'));
        }

        $selected ??= $companies->first();
        $selected?->loadMissing('owner');
        $selected?->loadCount(['contacts', 'deals']);

        return Inertia::render('crm/companies/hub', [
            'companies' => $companies,
            'selected' => $selected,
            'associations' => $selected ? $hub->companyAssociations($selected) : null,
            'timeline' => $selected ? $hub->timeline(company: $selected) : [],
            'attributes' => $selected ? $hub->attributeBag($workspace, 'company', $selected->id) : ['definitions' => [], 'values' => []],
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'company', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('company', $filters['columns'] ?? null, $filters['sort'] ?? null),
            'recordCount' => $filter->count($workspace, 'company', $filters),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
        ]);
    }
}
