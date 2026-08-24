<?php

namespace App\Http\Controllers\Desk;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Http\Controllers\Controller;
use App\Services\Connectors\ConnectorRegistrar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DeskConnectorController extends Controller
{
    /**
     * Placeholder connect for official Desk channels. Persists a connector
     * row and reports "needs official token" unless Evolution Cloud or a
     * stored Meta connection already satisfies the channel.
     */
    public function store(Request $request, ConnectorRegistrar $registrar): RedirectResponse
    {
        $registrar->refuseUnofficialWhatsApp((string) $request->input('provider', ''));

        $data = $request->validate([
            'provider' => ['required', 'string', Rule::in(ConnectorProvider::deskValues())],
        ]);

        $connector = $registrar->connect(
            $request->user()->workspace,
            ConnectorProvider::from($data['provider']),
        );

        Inertia::flash('toast', [
            'type' => $connector->status === ConnectorStatus::Connected ? 'success' : 'info',
            'message' => $connector->config['reason'] ?? $connector->status->value,
        ]);

        return back();
    }
}
