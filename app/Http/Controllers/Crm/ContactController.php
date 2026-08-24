<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Mailbox;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'contact');

        if (($filters['view'] ?? 'all') === 'mine') {
            $filters['owner'] = (string) $request->user()->id;
        }

        $query = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company', 'owner', 'deals.stage'])
            ->withCount(['threads', 'deals', 'enrollments']);

        $filter->applyToContacts($query, $filters);
        $filter->applySort('contact', $query, $filters);

        $contacts = $query->limit(120)->get();

        return Inertia::render('crm/contacts/index', [
            'contacts' => $contacts,
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name', 'city', 'wilaya']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'contact', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('contact', $filters['columns'] ?? null, $filters['sort'] ?? null),
            'recordCount' => $filter->count($workspace, 'contact', $filters),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'hasMailbox' => Mailbox::query()->forWorkspace($workspace)->exists(),
            'createOpen' => $request->boolean('create'),
        ]);
    }

    public function show(Request $request, Contact $contact, CrmHub $hub, RecordInsight $insight): Response
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $contact->load(['company', 'owner', 'deals.stage']);

        return Inertia::render('crm/contacts/show', [
            'contact' => $contact,
            'associations' => $hub->contactAssociations($contact),
            'timeline' => $hub->timeline(contact: $contact),
            'catchUp' => $hub->catchUp($contact),
            'attributes' => $hub->attributeBag($workspace, 'contact', $contact->id),
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name']),
            'members' => $hub->members($workspace),
            'askEvo' => $insight->forContact($contact),
            'contactEngagement' => $insight->contactEngagement($contact),
            'proactiveSummary' => $insight->proactiveSummary($contact),
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
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'lead_status' => ['nullable', 'string', 'max:40'],
            'add_another' => ['sometimes', 'boolean'],
        ]);

        $identity->createUnique($request->user()->workspace, $data);

        return $request->boolean('add_another')
            ? redirect()->route('crm.contacts.index', ['create' => 1])
            : redirect()->route('crm.contacts.index');
    }

    public function update(Request $request, Contact $contact, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'lead_status' => ['nullable', 'string', 'max:40'],
            'unanswered' => ['sometimes', 'boolean'],
            'attributes' => ['nullable', 'array'],
        ]);

        if (! empty($data['company_id'])) {
            Company::query()->forWorkspace($request->user()->workspace)->findOrFail($data['company_id']);
        }

        $contact->fill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? $contact->phone,
            'company_id' => $data['company_id'] ?? null,
            'owner_id' => $data['owner_id'] ?? null,
            'city' => $data['city'] ?? $contact->city,
            'wilaya' => $data['wilaya'] ?? $contact->wilaya,
            'lead_status' => array_key_exists('lead_status', $data) ? $data['lead_status'] : $contact->lead_status,
            'unanswered' => $request->has('unanswered') ? $request->boolean('unanswered') : $contact->unanswered,
        ])->save();

        if (isset($data['attributes'])) {
            $attributes->saveValues($request->user()->workspace, 'contact', $contact->id, $data['attributes']);
        }

        return back();
    }

    public function updateAttributes(Request $request, Contact $contact, CustomAttributes $attributes): RedirectResponse
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'attributes' => ['required', 'array'],
        ]);

        $attributes->saveValues(
            $request->user()->workspace,
            'contact',
            $contact->id,
            $data['attributes'],
            enforceRequired: true,
        );

        return back();
    }

    public function export(Request $request, CrmFilter $filter): StreamedResponse
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'contact');

        $query = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company', 'owner']);

        $filter->apply('contact', $query, $filters);

        $filename = 'contacts-'.now()->toDateString().'.csv';

        return response()->streamDownload(function () use ($query): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'owner', 'city', 'wilaya', 'created_at', 'last_activity_at']);

            $query->orderBy('first_name')->each(function (Contact $contact) use ($out): void {
                fputcsv($out, [
                    $contact->id,
                    $contact->first_name,
                    $contact->last_name,
                    $contact->email,
                    $contact->phone_e164 ?? $contact->phone,
                    $contact->company?->name,
                    $contact->owner?->name,
                    $contact->city,
                    $contact->wilaya,
                    $contact->created_at?->toDateTimeString(),
                    $contact->last_activity_at?->toDateTimeString(),
                ]);
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

}
