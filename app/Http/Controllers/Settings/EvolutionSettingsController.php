<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Evolution\EvolutionCloudService;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvolutionSettingsController extends Controller
{
    public function edit(Request $request, EvolutionCloudService $evolution): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/evolution', [
            'health' => $evolution->health($workspace),
            'config' => [
                'base_url_set' => filled(config('evolution.base_url')),
                'api_key_set' => filled(config('evolution.api_key')),
                'instance' => config('evolution.instance'),
                'webhook_url' => 'Workspace-scoped endpoint (hidden)',
                'graph_version' => config('evolution.meta.graph_version'),
                'phone_number_id_set' => filled(config('evolution.meta.phone_number_id')),
                'waba_id_set' => filled(config('evolution.meta.waba_id')),
                'token_set' => filled(config('evolution.meta.token')),
                'mode' => 'WHATSAPP-BUSINESS',
                'qrcode' => false,
            ],
            'last_webhook_at' => $workspace?->evolution_last_webhook_at,
            'last_event' => $workspace?->evolution_last_event,
        ]);
    }

    public function sync(
        Request $request,
        EvolutionCloudService $evolution,
        WebhookEndpointManager $endpoints,
    ): RedirectResponse {
        if (! $evolution->configured() || ! $evolution->cloudCredentialsPresent()) {
            return back()->with('error', 'Evolution Cloud is not connected.');
        }

        $evolution->createInstance();
        $evolution->setWebhook(
            $endpoints->urlFor(
                $request->user()->workspace,
                WebhookEndpointManager::PROVIDER_EVOLUTION,
            ),
        );

        return back();
    }
}
