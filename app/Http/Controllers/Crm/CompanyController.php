<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('crm/companies/index', [
            'companies' => Company::query()
                ->forWorkspace($request->user()->workspace)
                ->withCount('contacts')
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'domain' => ['nullable', 'string', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:120'],
        ]);

        Company::query()->create([
            ...$data,
            'workspace_id' => $request->user()->workspace_id,
            'country' => 'DZ',
        ]);

        return back();
    }

    public function show(Request $request, Company $company): Response
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('crm/companies/show', [
            'company' => $company->load(['contacts', 'deals.stage']),
        ]);
    }
}
