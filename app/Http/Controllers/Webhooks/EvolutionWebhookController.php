<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Evolution\EvolutionWebhookProcessor;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EvolutionWebhookController extends Controller
{
    public function verify(
        Request $request,
        string $webhookKey,
        WebhookEndpointManager $endpoints,
    ): Response|JsonResponse {
        $endpoints->resolve(WebhookEndpointManager::PROVIDER_EVOLUTION, $webhookKey);

        $token = (string) config('evolution.meta.webhook_verify_token');

        if ($token !== '' && $request->query('hub_verify_token') === $token) {
            return response((string) $request->query('hub_challenge', 'ok'));
        }

        if ($token !== '' && $request->query('hub.verify_token') === $token) {
            return response((string) $request->query('hub.challenge', 'ok'));
        }

        return response()->json(['ok' => true]);
    }

    public function handle(
        Request $request,
        string $webhookKey,
        EvolutionWebhookProcessor $processor,
        WebhookEndpointManager $endpoints,
    ): JsonResponse {
        abort_if(strlen($request->getContent()) > 262144, 413, 'Webhook payload is too large.');
        $endpoint = $endpoints->resolve(WebhookEndpointManager::PROVIDER_EVOLUTION, $webhookKey);
        $workspace = $endpoint->workspace;

        $message = $processor->handle($workspace, $request->all());
        $endpoints->markReceived($endpoint, $request->string('event')->toString());

        return response()->json([
            'ok' => true,
            'message_id' => $message?->id,
            'thread_id' => $message?->thread_id,
            'contact_id' => $message?->contact_id,
        ]);
    }
}
