<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
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
            'connectUrl' => $provider === 'meta' ? route('auth.meta', ['return' => 'setup']) : null,
            'appsUrl' => route('settings.apps'),
        ]);
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
