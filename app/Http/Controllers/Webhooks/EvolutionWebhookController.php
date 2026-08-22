<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EvolutionWebhookController extends Controller
{
    public function verify(Request $request): Response|JsonResponse
    {
        $token = (string) config('evolution.meta.webhook_verify_token');

        if ($token !== '' && $request->query('hub_verify_token') === $token) {
            return response((string) $request->query('hub_challenge', 'ok'));
        }

        if ($token !== '' && $request->query('hub.verify_token') === $token) {
            return response((string) $request->query('hub.challenge', 'ok'));
        }

        return response()->json(['ok' => true]);
    }

    public function handle(Request $request, EvolutionWebhookProcessor $processor): JsonResponse
    {
        $workspace = Workspace::query()->first();

        if (! $workspace) {
            return response()->json(['ok' => false, 'error' => 'No workspace'], 404);
        }

        $message = $processor->handle($workspace, $request->all());

        return response()->json([
            'ok' => true,
            'message_id' => $message?->id,
            'thread_id' => $message?->thread_id,
            'contact_id' => $message?->contact_id,
        ]);
    }
}
