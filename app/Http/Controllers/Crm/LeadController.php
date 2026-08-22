<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('crm/leads/index', [
            'leads' => Lead::query()->forWorkspace($workspace)->with('contact')->latest()->limit(100)->get(),
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:180'],
            'source' => ['nullable', 'string', 'max:80'],
        ]);

        $contact = Contact::query()->forWorkspace($request->user()->workspace)->findOrFail($data['contact_id']);

        Lead::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'title' => $data['title'],
            'source' => $data['source'] ?? 'manual',
            'status' => 'new',
        ]);

        return back();
    }

    public function show(Request $request, Lead $lead): Response
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('crm/leads/show', [
            'lead' => $lead->load(['contact', 'company', 'deal.stage']),
        ]);
    }

    public function qualify(Request $request, Lead $lead): RedirectResponse
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);
        $lead->qualify();

        return back();
    }
}
