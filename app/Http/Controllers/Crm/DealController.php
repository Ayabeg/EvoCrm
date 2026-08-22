<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Stage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline()->load('stages');

        return Inertia::render('crm/deals/index', [
            'deals' => Deal::query()->forWorkspace($workspace)->with(['contact', 'stage', 'company'])->latest()->limit(100)->get(),
            'stages' => $pipeline->stages,
            'contacts' => Contact::query()->forWorkspace($workspace)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'stage_id' => ['nullable', 'integer'],
        ]);

        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline();
        $stage = $data['stage_id']
            ? Stage::query()->where('pipeline_id', $pipeline->id)->findOrFail($data['stage_id'])
            : $pipeline->stageBySlug('new');

        $contact = Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id']);

        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'title' => $data['title'],
            'amount_cents' => $data['amount_cents'] ?? 0,
            'currency' => 'DZD',
        ]);

        return back();
    }

    public function show(Request $request, Deal $deal): Response
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('crm/deals/show', [
            'deal' => $deal->load(['contact', 'company', 'stage', 'pipeline.stages', 'lead']),
        ]);
    }

    public function update(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'amount_cents' => ['nullable', 'integer', 'min:0'],
            'next_activity_at' => ['nullable', 'date'],
        ]);

        $deal->update($data);

        return back();
    }

    public function move(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'stage_id' => ['required', 'integer'],
        ]);

        $stage = Stage::query()->where('pipeline_id', $deal->pipeline_id)->findOrFail($data['stage_id']);
        $deal->moveTo($stage);

        return back();
    }
}
