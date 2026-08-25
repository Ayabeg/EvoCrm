<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\Crm\ContactMerger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactMergeController extends Controller
{
    public function index(Request $request, ContactMerger $merger): Response
    {
        return Inertia::render('crm/contacts/duplicates', [
            'groups' => $merger->groups($request->user()->workspace),
        ]);
    }

    public function show(Request $request, Contact $survivor, Contact $absorbed): Response
    {
        $workspaceId = (int) $request->user()->workspace_id;
        abort_unless((int) $survivor->workspace_id === $workspaceId, 404);
        abort_unless((int) $absorbed->workspace_id === $workspaceId, 404);
        abort_if($survivor->is($absorbed), 404);

        $survivor->load('company');
        $absorbed->load('company');

        return Inertia::render('crm/contacts/merge', [
            'survivor' => $this->present($survivor),
            'absorbed' => $this->present($absorbed),
        ]);
    }

    public function store(Request $request, ContactMerger $merger): RedirectResponse
    {
        $data = $request->validate([
            'survivor_id' => ['required', 'integer'],
            'absorbed_id' => ['required', 'integer', 'different:survivor_id'],
            'values' => ['nullable', 'array'],
            'values.first_name' => ['nullable', 'string', 'max:120'],
            'values.last_name' => ['nullable', 'string', 'max:120'],
            'values.email' => ['nullable', 'email', 'max:180'],
            'values.phone' => ['nullable', 'string', 'max:40'],
            'values.city' => ['nullable', 'string', 'max:80'],
            'values.wilaya' => ['nullable', 'string', 'max:80'],
            'values.source' => ['nullable', 'string', 'max:80'],
            'values.lead_status' => ['nullable', 'string', 'max:40'],
            'values.external_id' => ['nullable', 'string', 'max:80'],
            'values.company_id' => ['nullable', 'integer'],
            'values.owner_id' => ['nullable', 'integer'],
        ]);

        $workspace = $request->user()->workspace;
        $survivor = Contact::query()->forWorkspace($workspace)->findOrFail($data['survivor_id']);
        $absorbed = Contact::query()->forWorkspace($workspace)->findOrFail($data['absorbed_id']);

        $merger->merge($workspace, $request->user(), $survivor, $absorbed, $data['values'] ?? []);

        return redirect()->route('crm.contacts.show', $survivor);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Contact $contact): array
    {
        return [
            'id' => $contact->id,
            'first_name' => $contact->first_name,
            'last_name' => $contact->last_name,
            'display_name' => $contact->displayName(),
            'email' => $contact->email,
            'phone' => $contact->phone,
            'phone_e164' => $contact->phone_e164,
            'city' => $contact->city,
            'wilaya' => $contact->wilaya,
            'source' => $contact->source,
            'lead_status' => $contact->lead_status,
            'external_id' => $contact->external_id,
            'company_id' => $contact->company_id,
            'company' => $contact->company?->name,
            'owner_id' => $contact->owner_id,
        ];
    }
}
