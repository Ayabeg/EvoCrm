<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Services\Ai\RecordInsight;
use App\Services\Crm\LeadConverter;
use App\Services\Crm\LeadScorer;
use App\Services\Crm\PipelineManager;
use App\Services\Enrichment\EnrichmentService;
use App\Support\CrmHub;
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
            'leads' => Lead::query()->forWorkspace($workspace)->with(['contact', 'latestScore'])->latest()->limit(100)->get(),
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

        $lead = Lead::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'title' => $data['title'],
            'source' => $data['source'] ?? 'manual',
            'status' => 'new',
        ]);

        app(LeadScorer::class)->score($lead, $request->user());

        return back();
    }

    public function show(Request $request, Lead $lead, CrmHub $hub, PipelineManager $pipelines, RecordInsight $insight, EnrichmentService $enrichment): Response
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $lead->load(['contact.company', 'contact.threads', 'contact.enrollments.sequence', 'contact.deals.stage', 'company', 'deal.stage', 'latestScore']);

        return Inertia::render('crm/leads/show', [
            'lead' => $lead,
            'leadScore' => $lead->latestScore?->present(),
            'askEvo' => $insight->forLead($lead),
            'associations' => [
                'contact' => $lead->contact,
                'company' => $lead->company,
                'deal' => $lead->deal,
                'threads' => $lead->contact?->threads ?? [],
                'enrollments' => $lead->contact?->enrollments ?? [],
                'deals' => $lead->contact?->deals ?? [],
            ],
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
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'source' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'in:new,working,qualified,disqualified'],
        ]);

        $lead->update($data);

        return back();
    }

    public function qualify(Request $request, Lead $lead, LeadConverter $converter): RedirectResponse
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

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
