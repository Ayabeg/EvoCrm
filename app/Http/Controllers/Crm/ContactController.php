<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\RecordRelationship;
use App\Models\Sequence;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\ContactIdentity;
use App\Services\Crm\ContactMerger;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use App\Services\Enrichment\EnrichmentService;
use App\Support\CrmHub;
use App\Support\CsvExport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub, ContactMerger $merger): Response
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

        $filter->apply('contact', $query, $filters);
        $filter->applySort('contact', $query, $filters);

        [$contactRows, $paginator] = $filter->paginate($query, $request);

        $qualityContacts = Contact::query()->forWorkspace($workspace);
        $dataQuality = [
            'missing_contact' => (clone $qualityContacts)
                ->whereNull('email')
                ->whereNull('phone_e164')
                ->count(),
            'missing_company' => (clone $qualityContacts)->whereNull('company_id')->count(),
            'unassigned' => (clone $qualityContacts)->whereNull('owner_id')->count(),
            'missing_source' => (clone $qualityContacts)->whereNull('source')->count(),
        ];

        if ($request->user()->canPermission('crm.merge')) {
            $duplicateSummary = $merger->duplicateSummary($workspace);
            $dataQuality['duplicate_groups'] = $duplicateSummary['groups'];
            $dataQuality['duplicate_contacts'] = $duplicateSummary['contacts'];
        } else {
            $dataQuality['duplicate_groups'] = 0;
            $dataQuality['duplicate_contacts'] = 0;
        }

        return Inertia::render('crm/contacts/index', [
            'contacts' => $hub->withListAttributes($workspace, 'contact', $contactRows),
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name', 'city', 'wilaya']),
            'members' => $hub->members($workspace),
            'savedFilters' => $hub->filters($workspace, 'contact', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('contact', $filters['columns'] ?? null, $filters['sort'] ?? null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'dataQuality' => $dataQuality,
            'cities' => config('evosales.cities'),
            'wilayas' => config('evosales.wilayas'),
            'hasMailbox' => Mailbox::query()->forWorkspace($workspace)->exists(),
            'createOpen' => $request->boolean('create'),
            'bulk' => [
                'enabled' => $request->user()->canPermission('crm.bulk'),
                'sequences' => Sequence::query()
                    ->forWorkspace($workspace)
                    ->orderBy('name')
                    ->get(['id', 'name']),
            ],
        ]);
    }

    public function show(Request $request, Contact $contact, CrmHub $hub, RecordInsight $insight, EnrichmentService $enrichment): Response
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $contact->load([
            'company.parentCompany',
            'owner',
            'deals.stage',
            'consents',
            'incomingRelationships.fromRecord',
            'outgoingRelationships.toRecord',
        ]);
        $pipeline = $workspace->defaultPipeline()->load('stages');

        $relationships = $contact->outgoingRelationships
            ->map(fn ($relationship): array => $this->presentRelationship($relationship, 'outgoing'))
            ->concat($contact->incomingRelationships->map(
                fn ($relationship): array => $this->presentRelationship($relationship, 'incoming')
            ))
            ->values()
            ->all();

        return Inertia::render('crm/contacts/show', [
            'contact' => array_merge($contact->toArray(), [
                'display_name' => $contact->displayName(),
            ]),
            'associations' => $hub->contactAssociations($contact),
            'timeline' => $hub->timeline(contact: $contact),
            'catchUp' => $hub->catchUp($contact),
            'attributes' => $hub->attributeBag($workspace, 'contact', $contact->id),
            'playbooks' => $hub->playbooks($workspace, 'contact'),
            'companies' => Company::query()->forWorkspace($workspace)->orderBy('name')->get(['id', 'name']),
            'members' => $hub->members($workspace),
            'askEvo' => $insight->forContact($contact),
            'contactEngagement' => $insight->contactEngagement($contact),
            'proactiveSummary' => $insight->proactiveSummary($contact),
            'consents' => $contact->consents->map(fn ($consent): array => [
                'id' => $consent->id,
                'channel' => $consent->channel,
                'purpose' => $consent->purpose,
                'status' => $consent->status,
                'granted' => $consent->isGranted(),
                'source' => $consent->source,
                'expires_at' => $consent->expires_at?->timezone('Africa/Algiers')->toIso8601String(),
            ])->values()->all(),
            'relationships' => $relationships,
            'enrichmentRuns' => $enrichment->history($workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id),
            'enrichAction' => "/crm/contacts/{$contact->id}/enrich",
            'dealsKanban' => [
                'pipeline' => $pipeline->only(['id', 'name']),
                'stages' => $pipeline->stages->map(fn ($stage) => [
                    'id' => $stage->id,
                    'name' => $stage->name,
                    'slug' => $stage->slug,
                ])->values(),
                'deals' => $contact->deals->map(fn ($deal) => [
                    'id' => $deal->id,
                    'title' => $deal->title,
                    'amount_cents' => (int) $deal->amount_cents,
                    'stage_id' => $deal->stage_id,
                ])->values(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentRelationship(RecordRelationship $relationship, string $direction): array
    {
        $record = $direction === 'outgoing' ? $relationship->toRecord : $relationship->fromRecord;
        $label = match (true) {
            $record instanceof Contact => $record->displayName(),
            $record instanceof Company => $record->name,
            $record instanceof Lead => $record->title,
            default => null,
        };
        $href = match (true) {
            $record instanceof Contact => '/crm/contacts/'.$record->id,
            $record instanceof Company => '/crm/companies/'.$record->id,
            $record instanceof Lead => '/crm/leads/'.$record->id,
            default => null,
        };

        return [
            'id' => $relationship->id,
            'direction' => $direction,
            'relationship_type' => $relationship->relationship_type,
            'label' => $label,
            'href' => $href,
        ];
    }

    public function store(Request $request, ContactIdentity $identity): RedirectResponse
    {
        $this->authorize('create', Contact::class);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'source' => ['nullable', 'string', 'max:80'],
            'source_detail' => ['nullable', 'string', 'max:180'],
            'source_campaign' => ['nullable', 'string', 'max:180'],
            'source_medium' => ['nullable', 'string', 'max:80'],
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
        $this->authorize('update', $contact);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'source' => ['nullable', 'string', 'max:80'],
            'source_detail' => ['nullable', 'string', 'max:180'],
            'source_campaign' => ['nullable', 'string', 'max:180'],
            'source_medium' => ['nullable', 'string', 'max:80'],
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
            'source' => array_key_exists('source', $data) ? $data['source'] : $contact->source,
            'source_detail' => array_key_exists('source_detail', $data) ? $data['source_detail'] : $contact->source_detail,
            'source_campaign' => array_key_exists('source_campaign', $data) ? $data['source_campaign'] : $contact->source_campaign,
            'source_medium' => array_key_exists('source_medium', $data) ? $data['source_medium'] : $contact->source_medium,
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
        $this->authorize('update', $contact);

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

    public function consent(Request $request, Contact $contact): RedirectResponse
    {
        $this->authorize('update', $contact);

        $data = $request->validate([
            'channel' => ['required', 'in:email,whatsapp,sms'],
            'purpose' => ['required', 'string', 'max:64'],
            'status' => ['required', 'in:granted,denied,unknown'],
            'source' => ['nullable', 'string', 'max:64'],
            'expires_at' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($contact, $data, $request): void {
            $consent = ContactConsent::query()->updateOrCreate(
                [
                    'workspace_id' => $contact->workspace_id,
                    'contact_id' => $contact->id,
                    'channel' => $data['channel'],
                    'purpose' => $data['purpose'],
                ],
                [
                    'status' => $data['status'],
                    'source' => $data['source'] ?? null,
                    'captured_at' => now(),
                    'expires_at' => $data['expires_at'] ?? null,
                    'revoked_at' => $data['status'] === ContactConsent::STATUS_GRANTED ? null : now(),
                ],
            );

            Activity::query()->create([
                'workspace_id' => $contact->workspace_id,
                'contact_id' => $contact->id,
                'company_id' => $contact->company_id,
                'type' => 'consent_updated',
                'subject' => 'Updated '.$consent->channel.' '.$consent->purpose.' consent',
                'owner_id' => $request->user()->id,
                'actor_id' => $request->user()->id,
                'meta' => [
                    'consent_id' => $consent->id,
                    'channel' => $consent->channel,
                    'purpose' => $consent->purpose,
                    'status' => $consent->status,
                ],
            ]);
        });

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
            fputcsv($out, ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'owner', 'city', 'wilaya', 'source', 'source_detail', 'source_campaign', 'source_medium', 'created_at', 'last_activity_at']);

            $query->orderBy('first_name')->each(function (Contact $contact) use ($out): void {
                fputcsv($out, CsvExport::row([
                    $contact->id,
                    $contact->first_name,
                    $contact->last_name,
                    $contact->email,
                    $contact->phone_e164 ?? $contact->phone,
                    $contact->company?->name,
                    $contact->owner?->name,
                    $contact->city,
                    $contact->wilaya,
                    $contact->source,
                    $contact->source_detail,
                    $contact->source_campaign,
                    $contact->source_medium,
                    $contact->created_at?->toDateTimeString(),
                    $contact->last_activity_at?->toDateTimeString(),
                ]));
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
