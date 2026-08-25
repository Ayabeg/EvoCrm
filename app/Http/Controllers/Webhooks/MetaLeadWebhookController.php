<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Ads\LeadFormIngestor;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetaLeadWebhookController extends Controller
{
    public function handle(
        Request $request,
        string $webhookKey,
        LeadFormIngestor $ingestor,
        WebhookEndpointManager $endpoints,
    ): JsonResponse {
        $endpoint = $endpoints->resolve(WebhookEndpointManager::PROVIDER_META_LEADS, $webhookKey);
        $workspace = $endpoint->workspace;

        $lead = $ingestor->ingest($workspace, $request->all());
        $endpoints->markReceived($endpoint, 'leadgen');

        return response()->json([
            'ok' => true,
            'ad_lead_id' => $lead->id,
            'lead_id' => $lead->lead_id,
            'contact_id' => $lead->contact_id,
        ]);
    }
}
