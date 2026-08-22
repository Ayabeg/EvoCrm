<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Ads\LeadFormIngestor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetaLeadWebhookController extends Controller
{
    public function handle(Request $request, LeadFormIngestor $ingestor): JsonResponse
    {
        $expected = (string) config('meta.lead_ingest_token');

        if ($expected !== '' && $request->header('X-EvoSales-Token') !== $expected) {
            return response()->json(['ok' => false, 'error' => 'Unauthorized'], 401);
        }

        $workspace = Workspace::query()->first();

        if (! $workspace) {
            return response()->json(['ok' => false, 'error' => 'No workspace'], 404);
        }

        $lead = $ingestor->ingest($workspace, $request->all());

        return response()->json([
            'ok' => true,
            'ad_lead_id' => $lead->id,
            'lead_id' => $lead->lead_id,
            'contact_id' => $lead->contact_id,
        ]);
    }
}
