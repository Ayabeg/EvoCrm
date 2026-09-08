<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Evolution\WhatsAppConnector;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvolutionSettingsController extends Controller
{
    public function edit(Request $request, WhatsAppConnector $whatsapp): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/evolution', [
            'whatsapp' => $whatsapp->phoneStatus($workspace),
            'whatsapp_business' => $whatsapp->provisionBusinessIfReady($workspace),
            'facebook_url' => '/auth/meta?popup=1',
            'last_webhook_at' => $workspace?->evolution_last_webhook_at,
            'last_event' => $workspace?->evolution_last_event,
        ]);
    }

    public function sync(Request $request, WhatsAppConnector $whatsapp)
    {
        $whatsapp->connectBusiness($request->user()->workspace);

        return redirect()->route('settings.whatsapp-business');
    }
}
