<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\LeadCapture;
use App\Services\Crm\LeadCaptureDeduper;
use App\Services\Crm\LeadCsvCaptureIngestor;
use App\Services\Crm\MapsSearchCaptureIngestor;
use App\Services\Crm\PublicUrlCaptureIngestor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadCaptureController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $source = (string) $request->query('source', '');
        $status = (string) $request->query('status', '');

        if ($source !== '' && ! in_array($source, LeadCapture::SOURCES, true)) {
            $source = '';
        }

        if ($status !== '' && ! in_array($status, LeadCapture::STATUSES, true)) {
            $status = '';
        }

        $captures = LeadCapture::query()
            ->forWorkspace($workspace)
            ->with('matchedLead:id,title,status')
            ->when($source !== '', fn ($query) => $query->where('source', $source))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (LeadCapture $capture) => [
                'id' => $capture->id,
                'source' => $capture->source,
                'status' => $capture->status,
                'name' => $capture->name,
                'phone' => $capture->phone,
                'email' => $capture->email,
                'company' => $capture->company,
                'wilaya' => $capture->wilaya,
                'error' => $capture->error,
                'matched_lead_id' => $capture->matched_lead_id,
                'matched_lead_title' => $capture->matchedLead?->title,
                'created_at' => $capture->created_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('crm/leads/captures', [
            'captures' => $captures,
            'filters' => [
                'source' => $source,
                'status' => $status,
            ],
            'sources' => LeadCapture::SOURCES,
            'statuses' => LeadCapture::STATUSES,
        ]);
    }

    public function csv(Request $request, LeadCsvCaptureIngestor $ingestor): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,text/plain', 'max:10240'],
        ]);

        $ingestor->ingest($request->user()->workspace, $request->user(), $data['file']);

        return back();
    }

    public function url(Request $request, PublicUrlCaptureIngestor $ingestor): RedirectResponse
    {
        $data = $request->validate([
            'url' => ['required', 'url', 'max:2048'],
        ]);

        $ingestor->ingest($request->user()->workspace, $request->user(), $data['url']);

        return back();
    }

    public function maps(Request $request, MapsSearchCaptureIngestor $ingestor): RedirectResponse
    {
        $data = $request->validate([
            'query' => ['required', 'string', 'max:180'],
            'wilaya' => ['required', 'string', 'max:80'],
            'results' => ['required', 'array', 'min:1'],
            'results.*.name' => ['nullable', 'string', 'max:180'],
            'results.*.phone' => ['nullable', 'string', 'max:40'],
            'results.*.email' => ['nullable', 'email', 'max:180'],
            'results.*.company' => ['nullable', 'string', 'max:180'],
        ]);

        $ingestor->ingest(
            $request->user()->workspace,
            $request->user(),
            $data['query'],
            $data['wilaya'],
            $data['results'],
        );

        return back();
    }

    public function accept(Request $request, LeadCapture $capture, LeadCaptureDeduper $deduper): RedirectResponse
    {
        abort_unless((int) $capture->workspace_id === (int) $request->user()->workspace_id, 404);

        $deduper->process($capture);

        return back();
    }

    public function reject(Request $request, LeadCapture $capture, LeadCaptureDeduper $deduper): RedirectResponse
    {
        abort_unless((int) $capture->workspace_id === (int) $request->user()->workspace_id, 404);

        $deduper->reject($capture);

        return back();
    }
}
