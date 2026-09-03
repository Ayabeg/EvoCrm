<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Meta\MetaWebhookService;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetaLeadWebhookController extends Controller
{
    public function verify(
        Request $request,
        string $webhookKey,
        WebhookEndpointManager $endpoints,
        MetaWebhookService $webhooks,
    ): Response {
        $endpoint = $endpoints->resolve(WebhookEndpointManager::PROVIDER_META_LEADS, $webhookKey);

        if ($request->query('hub_mode', $request->query('hub.mode')) === 'subscribe'
            && $webhooks->verifyToken(
                $request->query('hub_verify_token', $request->query('hub.verify_token')),
                $endpoint,
            )) {
            return response((string) $request->query('hub_challenge', $request->query('hub.challenge', 'ok')));
        }

        abort(403);
    }

    public function handle(
        Request $request,
        string $webhookKey,
        WebhookEndpointManager $endpoints,
        MetaWebhookService $webhooks,
    ): JsonResponse {
        $endpoint = $endpoints->resolve(WebhookEndpointManager::PROVIDER_META_LEADS, $webhookKey);
        $workspace = $endpoint->workspace;
        $raw = $request->getContent();
        $payload = $request->all();
        $official = isset($payload['entry']) || isset($payload['object']);

        if ($official || $request->headers->has('X-Hub-Signature-256')) {
            abort_unless(
                $webhooks->signatureValid($raw, $request->header('X-Hub-Signature-256')),
                403,
            );
        }

        $events = $webhooks->accept($workspace, $endpoint, $payload);
        $endpoints->markReceived($endpoint, 'leadgen');

        return response()->json([
            'ok' => true,
            'accepted' => count($events),
        ]);
    }
}
