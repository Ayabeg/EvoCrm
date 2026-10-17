<?php

namespace App\Http\Controllers\Crm;

use App\Enums\ChannelType;
use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\User;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\LeadConverter;
use App\Services\Crm\LeadScorer;
use App\Services\Crm\PipelineManager;
use App\Services\Enrichment\EnrichmentService;
use App\Support\CrmHub;
use App\Support\LeadPath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request, CrmHub $hub, CrmFilter $filter): Response
    {
        $workspace = $request->user()->workspace;
        $filters = $filter->resolve($request, $workspace, 'lead');

        $query = Lead::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'latestScore']);

        $filter->apply('lead', $query, $filters);
        $query->latest();

        [$leads, $paginator] = $filter->paginate($query, $request);

        return Inertia::render('crm/leads/index', [
            'leads' => $leads,
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'savedFilters' => $hub->filters($workspace, 'lead', $request->user()),
            'activeFilters' => $filters,
            'listView' => $hub->listViewMeta('lead', $filters['columns'] ?? null, $filters['sort'] ?? null, $workspace),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Lead::class);

        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:180'],
            'source' => ['nullable', 'string', 'max:80'],
            'source_detail' => ['nullable', 'string', 'max:180'],
            'source_campaign' => ['nullable', 'string', 'max:180'],
            'source_medium' => ['nullable', 'string', 'max:80'],
        ]);

        $contact = Contact::query()->forWorkspace($request->user()->workspace)->findOrFail($data['contact_id']);

        $lead = Lead::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'title' => $data['title'],
            'source' => $data['source'] ?? 'manual',
            'source_detail' => $data['source_detail'] ?? null,
            'source_campaign' => $data['source_campaign'] ?? null,
            'source_medium' => $data['source_medium'] ?? null,
            'status' => 'new',
        ]);

        app(LeadScorer::class)->score($lead, $request->user());

        return back();
    }

    public function show(Request $request, Lead $lead, CrmHub $hub, PipelineManager $pipelines, RecordInsight $insight, EnrichmentService $enrichment): Response
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $lead->load([
            'contact.company',
            'contact.owner',
            'contact.threads.channel',
            'contact.enrollments.sequence',
            'contact.deals.stage',
            'company',
            'deal.stage',
            'latestScore',
        ]);

        $threads = $lead->contact?->threads ?? collect();
        $whatsappThread = $threads->first(
            fn ($thread) => $thread->channel?->type === ChannelType::WhatsAppCloud,
        );
        $lastWhatsapp = $whatsappThread?->messages()->latest('id')->first();

        return Inertia::render('crm/leads/show', [
            'lead' => $lead,
            'leadScore' => $lead->latestScore?->present(),
            'path' => LeadPath::present($lead),
            'askEvo' => $insight->forLead($lead),
            'associations' => [
                'contact' => $lead->contact,
                'company' => $lead->company,
                'deal' => $lead->deal,
                'threads' => $threads,
                'enrollments' => $lead->contact?->enrollments ?? [],
                'deals' => $lead->contact?->deals ?? [],
            ],
            'whatsapp' => $whatsappThread ? [
                'thread_id' => $whatsappThread->id,
                'subject' => $whatsappThread->subject,
                'last_message' => $lastWhatsapp?->body,
                'last_message_at' => ($lastWhatsapp?->created_at ?? $whatsappThread->last_message_at)?->toIso8601String(),
                'direction' => $lastWhatsapp?->direction,
            ] : null,
            'contacts' => Contact::query()
                ->forWorkspace($workspace)
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name']),
            'pipelines' => $pipelines->options($workspace)->load('stages')->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'is_default' => (bool) $row->is_default,
                'stages' => $row->stages()->orderBy('position')->get(['id', 'name', 'slug', 'pipeline_id']),
            ])->values(),
            'members' => $hub->members($workspace),
            'contactDeals' => $lead->contact?->deals?->map(fn ($deal) => [
                'id' => $deal->id,
                'title' => $deal->title,
                'stage' => $deal->stage?->name,
            ])->values() ?? [],
            'enrichmentRuns' => $enrichment->history($workspace, EnrichmentRun::TARGET_LEAD, (int) $lead->id),
            'enrichAction' => "/crm/leads/{$lead->id}/enrich",
        ]);
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $this->authorize('update', $lead);

        if ($request->exists('owner_id') && $request->input('owner_id') === '') {
            $request->merge(['owner_id' => null]);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'source' => ['sometimes', 'nullable', 'string', 'max:80'],
            'source_detail' => ['sometimes', 'nullable', 'string', 'max:180'],
            'source_campaign' => ['sometimes', 'nullable', 'string', 'max:180'],
            'source_medium' => ['sometimes', 'nullable', 'string', 'max:80'],
            'status' => ['sometimes', 'nullable', 'in:new,working,disqualified'],
            'path_step' => ['sometimes', 'nullable', 'in:new,contacted,nurturing,unqualified'],
            'owner_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        if (isset($data['path_step'])) {
            LeadPath::apply($lead, (string) $data['path_step']);
            unset($data['path_step'], $data['status']);
        }

        if (array_key_exists('owner_id', $data)) {
            $ownerId = $data['owner_id'];
            unset($data['owner_id']);

            if ($ownerId) {
                $owner = User::query()
                    ->where('workspace_id', $lead->workspace_id)
                    ->findOrFail($ownerId);
                $lead->contact?->forceFill(['owner_id' => $owner->id])->save();
                $recordName = $lead->contact?->display_name ?: $lead->title;
                Inertia::flash('toast', [
                    'type' => 'success',
                    'message' => "{$owner->name} now owns the record for {$recordName}.",
                ]);
            } else {
                $lead->contact?->forceFill(['owner_id' => null])->save();
            }
        }

        if ($data !== []) {
            $lead->update($data);
        }

        return back();
    }

    public function qualify(Request $request, Lead $lead, LeadConverter $converter): RedirectResponse
    {
        $this->authorize('qualify', $lead);

        $data = $request->validate([
            'mode' => ['nullable', 'in:create,link'],
            'pipeline_id' => ['nullable', 'integer'],
            'stage_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'amount_dzd' => ['nullable', 'numeric', 'min:0'],
            'deal_id' => ['nullable', 'integer'],
        ]);

        $converter->convert($lead, $request->user(), $data);

        return back();
    }
}
