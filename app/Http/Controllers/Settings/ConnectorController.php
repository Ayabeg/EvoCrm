<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ConnectorProvider;
use App\Http\Controllers\Controller;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Connectors\GoogleCalendarSync;
use App\Services\Connectors\GoogleMailSync;
use App\Support\GoogleAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class ConnectorController extends Controller
{
    public function index(Request $request, ConnectorRegistrar $registrar): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/connectors', [
            'googleEnabled' => GoogleAuth::enabled(),
            'googleCallback' => (string) config('services.google.redirect'),
            'deskConnectors' => $registrar->deskCatalog($workspace),
            'googleConnectors' => $registrar->googleCatalog($workspace),
        ]);
    }

    /**
     * Persist Gmail / Calendar intent + status without sending mail.
     */
    public function store(Request $request, ConnectorRegistrar $registrar): RedirectResponse
    {
        $data = $request->validate([
            'provider' => ['required', 'string', Rule::in(ConnectorProvider::googleValues())],
        ]);

        $connector = $registrar->connect(
            $request->user()->workspace,
            ConnectorProvider::from($data['provider']),
        );

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => $connector->config['reason'] ?? 'Connector intent saved.',
        ]);

        return back();
    }

    /**
     * Reuse the existing Google OAuth client with extra Gmail/Calendar
     * scopes. Login stays on /auth/google and never requests these scopes.
     */
    public function reconnectGoogle(Request $request, string $provider, ConnectorRegistrar $registrar): RedirectResponse|SymfonyRedirectResponse
    {
        abort_unless(GoogleAuth::enabled(), 404);

        $registrar->refuseUnofficialWhatsApp($provider);

        $enum = ConnectorProvider::tryFrom($provider);
        abort_unless($enum instanceof ConnectorProvider && $enum->isGoogle(), 404);

        if (! GoogleAuth::hasConnectorScope($enum)) {
            $registrar->connect($request->user()->workspace, $enum);

            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'Reconnect Google with Calendar/Gmail. Add those scopes to the existing OAuth client first. Sign-in is unchanged.',
            ]);

            return redirect()->route('settings.connectors');
        }

        $request->session()->put('google_connector_intent', $enum->value);

        return GoogleAuth::redirectForConnector($enum);
    }

    public function startSync(Request $request, string $provider, GoogleMailSync $mail, GoogleCalendarSync $calendar): RedirectResponse
    {
        $enum = ConnectorProvider::tryFrom($provider);
        abort_unless($enum instanceof ConnectorProvider && $enum->isGoogle(), 404);

        $workspace = $request->user()->workspace;
        $enum === ConnectorProvider::Gmail
            ? $mail->start($workspace)
            : $calendar->start($workspace);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $enum->label().' sync started.',
        ]);

        return back();
    }

    public function pauseSync(Request $request, string $provider, GoogleMailSync $mail, GoogleCalendarSync $calendar): RedirectResponse
    {
        $enum = ConnectorProvider::tryFrom($provider);
        abort_unless($enum instanceof ConnectorProvider && $enum->isGoogle(), 404);

        $workspace = $request->user()->workspace;
        $enum === ConnectorProvider::Gmail
            ? $mail->pause($workspace)
            : $calendar->pause($workspace);

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => $enum->label().' sync paused.',
        ]);

        return back();
    }
}
