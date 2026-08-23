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
        return $this->hub($request, $hub, null);
    }

    public function show(Request $request, Company $company, CrmHub $hub): Response
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        return $this->hub($request, $hub, $company);
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

    protected function hub(Request $request, CrmHub $hub, ?Company $selected): Response
    {
        $workspace = $request->user()->workspace;

        $companies = Company::query()
            ->forWorkspace($workspace)
            ->with('owner')
            ->withCount(['contacts', 'deals'])
            ->orderBy('name')
            ->limit(120)
            ->get();

        if (! $selected && $request->integer('company')) {
            $selected = Company::query()->forWorkspace($workspace)->find($request->integer('company'));
        }

        $selected ??= $companies->first();

        return Inertia::render('crm/companies/hub', [
            'companies' => $companies,
            'selected' => $selected,
            'associations' => $selected ? $hub->companyAssociations($selected) : null,
            'timeline' => $selected ? $hub->timeline(company: $selected) : [],
            'attributes' => $selected ? $hub->attributeBag($workspace, 'company', $selected->id) : ['definitions' => [], 'values' => []],
            'members' => $hub->members($workspace),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
        ]);
    }
}
