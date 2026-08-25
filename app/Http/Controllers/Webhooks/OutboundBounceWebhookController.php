<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Outbound\BounceProcessor;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OutboundBounceWebhookController extends Controller
{
    public function handle(
        Request $request,
        string $webhookKey,
        BounceProcessor $processor,
        WebhookEndpointManager $endpoints,
    ): JsonResponse {
        $endpoint = $endpoints->resolve(WebhookEndpointManager::PROVIDER_OUTBOUND_BOUNCE, $webhookKey);
        $message = $processor->process($endpoint->workspace, $request->all());
        $endpoints->markReceived($endpoint, (string) ($request->input('type') ?? 'bounce'));

        return response()->json([
            'ok' => true,
            'message_id' => $message->id,
            'bounce_type' => $message->bounce_type,
        ]);
    }
}
