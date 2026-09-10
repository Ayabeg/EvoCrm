<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ConnectorProvider;
use App\Http\Controllers\Controller;
use App\Models\Connector;
use App\Models\Integration;
use App\Support\GoogleAuth;
use App\Support\MetaAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Kommo-style multi-step OAuth setup wizard. Provider configs live in
 * config/oauth_setup.php; step content is rendered per provider on the
 * client with shared chrome (stepper, troubleshooting, back/next).
 */
class OAuthSetupController extends Controller
{
    public function start(): RedirectResponse
    {
        return redirect()->route('settings.setup.show', ['provider' => 'start']);
    }

    public function show(Request $request, string $provider): Response
    {
        $config = $this->config($provider);
        $steps = $config['steps'];
        $stepKey = $request->query('step', $steps[0]['key']);

        if (! collect($steps)->pluck('key')->contains($stepKey)) {
            $stepKey = $steps[0]['key'];
        }

        $request->session()->put("oauth_setup.{$provider}.step", $stepKey);

        $stepIndex = collect($steps)->search(fn ($step) => $step['key'] === $stepKey);

        return Inertia::render('settings/setup/wizard', [
            'provider' => $provider,
            'providerName' => $config['name'],
            'tagline' => $config['tagline'],
            'steps' => $steps,
            'currentStep' => $stepKey,
            'stepIndex' => $stepIndex === false ? 0 : $stepIndex,
            'troubleshooting' => $config['troubleshooting'] ?? [],
            'connectUrl' => $provider === 'meta'
                ? route('auth.meta', ['return' => 'setup', 'popup' => 1])
                : null,
            'appsUrl' => route('settings.apps'),
            'metaState' => $provider === 'meta' ? $this->metaState($request) : null,
            'startState' => $provider === 'start' ? $this->startState($request) : null,
        ]);
    }

    public function updateMetaPage(Request $request): RedirectResponse
    {
        $integration = $request->user()->workspace->integration(Integration::PROVIDER_META);
        abort_unless($integration?->isConnected(), 404);

        $data = $request->validate([
            'page_id' => ['required', 'string', 'max:64'],
        ]);

        $pages = collect($integration->meta['pages'] ?? []);
        abort_unless($pages->contains(fn ($page) => ($page['id'] ?? '') === $data['page_id']), 422);

        $meta = $integration->meta ?? [];
        $meta['selected_page_id'] = $data['page_id'];
        $meta['selected_page_name'] = (string) $pages->firstWhere('id', $data['page_id'])['name'] ?? '';

        $integration->forceFill(['meta' => $meta])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Default Facebook Page saved for this workspace.',
        ]);

        return redirect()->route('settings.setup.show', ['provider' => 'meta', 'step' => 'finish']);
    }

    /** @return array<string, mixed> */
    private function metaState(Request $request): array
    {
        $integration = $request->user()->workspace->integration(Integration::PROVIDER_META);

        return [
            'configured' => MetaAuth::enabled(),
            'connected' => $integration?->isConnected() ?? false,
            'connected_at' => $integration?->connected_at?->toIso8601String(),
            'account_name' => $integration?->meta['name'] ?? null,
            'pages' => $integration?->meta['pages'] ?? [],
            'selected_page_id' => $integration?->meta['selected_page_id'] ?? null,
            'selected_page_name' => $integration?->meta['selected_page_name'] ?? null,
            'unlocks' => MetaAuth::unlocks($integration),
        ];
    }

    /** @return array<string, mixed> */
    private function startState(Request $request): array
    {
        $workspace = $request->user()->workspace;
        $calendar = Connector::query()
            ->forWorkspace($workspace)
            ->where('provider', ConnectorProvider::GoogleCalendar)
            ->first();
        $sms = $workspace->integration(Integration::PROVIDER_SMS);
        $whatsapp = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $cloud = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);

        return [
            'google' => [
                'connected' => $calendar?->isConnected() ?? false,
                'configured' => GoogleAuth::enabled(),
                'connect_url' => GoogleAuth::enabled()
                    ? '/settings/connectors/google/'.ConnectorProvider::GoogleCalendar->value.'?return=start'
                    : null,
            ],
            'whatsapp' => [
                'connected' => ($whatsapp?->isConnected() ?? false) || ($cloud?->isConnected() ?? false),
                'connect_url' => '/auth/meta?return=start&popup=1',
            ],
            'sms' => [
                'connected' => $sms?->isConnected() ?? false,
                'key_set' => filled($sms?->access_token),
                'url' => $sms?->meta['url'] ?? config('sms.http.url'),
                'sender' => $sms?->meta['sender'] ?? config('sms.sender', 'EVOTECHLY'),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function config(string $provider): array
    {
        $config = config("oauth_setup.{$provider}");

        if (! is_array($config)) {
            throw new NotFoundHttpException('Unknown setup provider.');
        }

        return $config;
    }
}
