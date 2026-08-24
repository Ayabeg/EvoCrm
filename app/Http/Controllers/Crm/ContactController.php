<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Support\ListViewConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub, RecordInsight $insight): Response
    {
        return $this->hub($request, $filter, $hub, $insight, null);
    }

    public function show(Request $request, Contact $contact, CrmFilter $filter, CrmHub $hub, RecordInsight $insight): Response
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        return $this->hub($request, $filter, $hub, $insight, $contact);
    }

    public function export(Request $request, CrmFilter $filter): StreamedResponse
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'contact');

        $query = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company', 'owner']);

        $filter->apply('contact', $query, $filters);

        $contacts = $query->orderBy('first_name')->limit(5000)->get();
        $filename = 'contacts-'.now()->toDateString().'.csv';

        return response()->streamDownload(function () use ($contacts): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'owner', 'city', 'wilaya', 'created_at', 'last_activity_at']);

            foreach ($contacts as $contact) {
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
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
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
        ]);

        $identity->createUnique($request->user()->workspace, $data);

        return back();
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

    protected function hub(Request $request, CrmFilter $filter, CrmHub $hub, RecordInsight $insight, ?Contact $selected): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'contact');

        $query = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company', 'owner', 'deals.stage'])
            ->withCount(['threads', 'deals', 'enrollments']);

        $filter->apply('contact', $query, $filters);
        $filter->applySort('contact', $query, $filters);

        $contacts = $query->orderByDesc('last_activity_at')->orderBy('first_name')->limit(120)->get();

        if (! $selected && $request->integer('contact')) {
            $selected = Contact::query()->forWorkspace($workspace)->find($request->integer('contact'));
        }

        $selected ??= $contacts->first();

        return Inertia::render('crm/contacts/hub', [
            'contacts' => $contacts,
            'selected' => $selected,
            'associations' => $selected ? $hub->contactAssociations($selected) : null,
            'timeline' => $selected ? $hub->timeline(contact: $selected) : [],
            'catchUp' => $selected ? $hub->catchUp($selected) : ['inbound' => [], 'outbound' => []],
            'askEvo' => $selected ? $insight->forContact($selected) : null,
            'contactEngagement' => $selected ? $insight->contactEngagement($selected) : null,
            'proactiveSummary' => $selected ? $insight->proactiveSummary($selected) : null,
            'attributes' => $selected ? $hub->attributeBag($workspace, 'contact', $selected->id) : ['definitions' => [], 'values' => []],
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name', 'city', 'wilaya']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'contact', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('contact', $filters['columns'] ?? null, $filters['sort'] ?? null),
            'recordCount' => $filter->count($workspace, 'contact', $filters),
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
        ]);
    }
}
