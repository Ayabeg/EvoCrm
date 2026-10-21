<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EnrichmentController extends Controller
{
    public function lead(Request $request, Lead $lead, EnrichmentService $enrichment): RedirectResponse
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        $enrichment->queue($request->user()->workspace, EnrichmentRun::TARGET_LEAD, (int) $lead->id);

        return back();
    }

    public function contact(Request $request, Contact $contact, EnrichmentService $enrichment): RedirectResponse
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $enrichment->queue($request->user()->workspace, EnrichmentRun::TARGET_CONTACT, (int) $contact->id);

        return back();
    }

    public function company(Request $request, Company $company, EnrichmentService $enrichment): RedirectResponse
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $enrichment->queue($request->user()->workspace, EnrichmentRun::TARGET_COMPANY, (int) $company->id);

        return back();
    }

    public function bulk(Request $request, EnrichmentService $enrichment): RedirectResponse
    {
        $data = $request->validate([
            'target_type' => ['required', Rule::in([
                EnrichmentRun::TARGET_COMPANY,
                EnrichmentRun::TARGET_CONTACT,
                EnrichmentRun::TARGET_LEAD,
            ])],
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'min:1'],
        ]);

        $workspace = $request->user()->workspace;
        $targetType = (string) $data['target_type'];
        $requested = array_map('intval', $data['ids']);
        $queued = 0;

        foreach ($requested as $targetId) {
            if (! $enrichment->resolve($workspace, $targetType, $targetId)) {
                continue;
            }

            $enrichment->queue($workspace, $targetType, $targetId);
            $queued++;
        }

        return back()->with('status', sprintf(
            'Queued enrichment for %d record(s); %d skipped.',
            $queued,
            count($requested) - $queued,
        ));
    }

    public function apply(Request $request, EnrichmentRun $run, EnrichmentService $enrichment): RedirectResponse
    {
        abort_unless((int) $run->workspace_id === (int) $request->user()->workspace_id, 404);

        $enrichment->apply($run, $request->user());

        return back();
    }

    public function dismiss(Request $request, EnrichmentRun $run, EnrichmentService $enrichment): RedirectResponse
    {
        abort_unless((int) $run->workspace_id === (int) $request->user()->workspace_id, 404);

        $enrichment->dismiss($run, $request->user());

        return back();
    }
}
