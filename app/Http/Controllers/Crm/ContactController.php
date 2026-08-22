<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Services\Crm\ContactIdentity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('crm/contacts/index', [
            'contacts' => Contact::query()->forWorkspace($workspace)->with('company')->latest()->limit(100)->get(),
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, ContactIdentity $identity): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
        ]);

        $identity->createUnique($request->user()->workspace, $data);

        return back();
    }

    public function show(Request $request, Contact $contact): Response
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $contact->load(['company', 'leads', 'deals.stage', 'threads.messages']);

        return Inertia::render('crm/contacts/show', [
            'contact' => $contact,
        ]);
    }
}
