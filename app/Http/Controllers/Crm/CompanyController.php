<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Crm\CustomAttributes;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $view = $request->string('view')->toString() ?: 'all';
        $q = $request->string('q')->toString();

        $query = Company::query()
            ->forWorkspace($workspace)
            ->with('owner')
            ->withCount(['contacts', 'deals']);

        if ($view === 'mine') {
            $query->where('owner_id', $request->user()->id);
        }

        if ($q !== '') {
            $query->where(function ($inner) use ($q) {
                $inner->where('name', 'like', "%{$q}%")
                    ->orWhere('domain', 'like', "%{$q}%")
                    ->orWhere('city', 'like', "%{$q}%");
            });
        }

        if ($request->filled('owner') && $request->string('owner') !== 'unassigned') {
            $query->where('owner_id', $request->integer('owner'));
        }

        return Inertia::render('crm/companies/index', [
            'companies' => $query->orderBy('name')->limit(120)->get(),
            'members' => $hub->members($workspace),
            'cities' => config('evosales.cities'),
            'activeFilters' => [
                'view' => $view,
                'q' => $q,
                'owner' => $request->input('owner'),
            ],
            'createOpen' => $request->boolean('create'),
        ]);
    }

    public function show(Request $request, Company $company, CrmHub $hub): Response
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $company->load(['owner', 'contacts', 'deals.stage']);

        return Inertia::render('crm/companies/show', [
            'company' => $company,
            'associations' => $hub->companyAssociations($company),
            'timeline' => $hub->timeline(company: $company),
            'attributes' => $hub->attributeBag($workspace, 'company', $company->id),
            'members' => $hub->members($workspace),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
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
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

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
