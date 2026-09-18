<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Evolution\WhatsAppConnector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    public function show(Request $request, WhatsAppConnector $whatsapp): Response
    {
        return Inertia::render('settings/whatsapp', [
            'channel' => $whatsapp->phoneStatus($request->user()->workspace),
            'facebook_url' => '/auth/meta?popup=1',
            'can_configure' => $request->user()->canPermission('settings.integrations'),
        ]);
    }

    public function connect(Request $request, WhatsAppConnector $whatsapp): RedirectResponse
    {
        $channel = $whatsapp->connectPhone($request->user()->workspace);

        Inertia::flash('toast', [
            'type' => $channel['available'] ? 'success' : 'info',
            'message' => $channel['message'],
        ]);

        return redirect()->route('settings.whatsapp');
    }

    public function status(Request $request, WhatsAppConnector $whatsapp): JsonResponse
    {
        return response()->json(
            $whatsapp->phoneStatus($request->user()->workspace, refreshQr: true)
        );
    }

    public function destroy(Request $request, WhatsAppConnector $whatsapp): RedirectResponse
    {
        abort_unless($request->user()?->role->canManageSettings(), 403);

        $whatsapp->disconnectPhone($request->user()->workspace);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'WhatsApp disconnected.',
        ]);

        return redirect()->route('settings.apps');
    }

    public function showBusiness(Request $request, WhatsAppConnector $whatsapp): Response
    {
        return Inertia::render('settings/whatsapp-business', [
            'channel' => $whatsapp->provisionBusinessIfReady($request->user()->workspace),
            'facebook_url' => '/auth/meta?popup=1',
            'can_configure' => $request->user()->canPermission('settings.integrations'),
        ]);
    }

    public function connectBusiness(Request $request, WhatsAppConnector $whatsapp): RedirectResponse
    {
        $channel = $whatsapp->connectBusiness($request->user()->workspace);

        Inertia::flash('toast', [
            'type' => $channel['connected'] ? 'success' : 'info',
            'message' => $channel['message'],
        ]);

        return redirect()->route('settings.whatsapp-business');
    }

    public function destroyBusiness(Request $request, WhatsAppConnector $whatsapp): RedirectResponse
    {
        abort_unless($request->user()?->role->canManageSettings(), 403);

        $whatsapp->disconnectBusiness($request->user()->workspace);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'WhatsApp Business disconnected.',
        ]);

        return redirect()->route('settings.apps');
    }
}
