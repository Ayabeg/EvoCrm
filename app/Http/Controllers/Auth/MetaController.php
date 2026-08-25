<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Support\MetaAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

/**
 * Workspace Meta connection — official Facebook Login (OAuth) only.
 * One grant unlocks Facebook Page, Instagram, WhatsApp Cloud, and Ads.
 * Tokens live on the workspace, encrypted. No Baileys, no unofficial paths.
 */
class MetaController extends Controller
{
    /**
     * Send the signed-in user to Meta's OAuth consent screen asking for the
     * full first-wave scope set (pages, Instagram, WhatsApp Cloud, Ads).
     */
    public function redirect(Request $request): SymfonyRedirectResponse
    {
        abort_unless(MetaAuth::enabled(), 404);

        if ($request->query('return') === 'setup') {
            $request->session()->put('auth.meta.return', 'setup');
        }

        return Socialite::driver('meta')
            ->scopes(MetaAuth::scopes())
            ->usingGraphVersion(MetaAuth::graphVersion())
            ->reRequest()
            ->redirect();
    }

    /**
     * Handle the Meta callback: swap the short-lived user token for a
     * long-lived one, read the actually granted permissions, discover pages
     * and ad accounts best-effort, then store the connection encrypted on
     * the workspace.
     */
    public function callback(Request $request): RedirectResponse
    {
        abort_unless(MetaAuth::enabled(), 404);

        try {
            $metaUser = Socialite::driver('meta')
                ->usingGraphVersion(MetaAuth::graphVersion())
                ->user();
        } catch (Throwable $exception) {
            Log::warning('Meta OAuth callback failed', ['error' => $exception->getMessage()]);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Meta did not complete the connection. No token was stored.',
            ]);

            if ($request->session()->pull('auth.meta.return') === 'setup') {
                return redirect()->route('settings.setup.show', ['provider' => 'meta', 'step' => 'connect']);
            }

            return redirect()->route('settings.apps');
        }

        $token = (string) $metaUser->token;
        $expiresIn = is_numeric($metaUser->expiresIn ?? null) ? (int) $metaUser->expiresIn : null;
        $longLived = false;

        // Short-lived user token → long-lived (~60 days). Best-effort: keep
        // the short-lived token if the exchange is unreachable.
        try {
            $exchange = Http::timeout(15)->get($this->graphUrl('/oauth/access_token'), [
                'grant_type' => 'fb_exchange_token',
                'client_id' => config('meta.app_id'),
                'client_secret' => config('meta.app_secret'),
                'fb_exchange_token' => $token,
            ]);

            if ($exchange->successful() && filled($exchange->json('access_token'))) {
                $token = (string) $exchange->json('access_token');
                $expiresIn = is_numeric($exchange->json('expires_in')) ? (int) $exchange->json('expires_in') : $expiresIn;
                $longLived = true;
            }
        } catch (Throwable $exception) {
            Log::info('Meta long-lived token exchange skipped', ['error' => $exception->getMessage()]);
        }

        $scopes = $this->grantedScopes($token) ?? MetaAuth::scopes();
        $pages = $this->discover($token, '/me/accounts', in_array('pages_show_list', $scopes, true));
        $adAccounts = $this->discover($token, '/me/adaccounts', in_array('ads_management', $scopes, true));

        $workspace = $request->user()->workspace;
        $existing = $workspace->integration(Integration::PROVIDER_META);
        $selectedAccount = (string) ($existing?->meta['selected_ad_account_id'] ?? '');
        $discoveredIds = array_column($adAccounts, 'id');

        if (! in_array($selectedAccount, $discoveredIds, true)) {
            $selectedAccount = count($adAccounts) === 1 ? $adAccounts[0]['id'] : '';
        }

        $integration = Integration::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'provider' => Integration::PROVIDER_META],
            [
                'status' => 'connected',
                'access_token' => $token,
                'expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
                'scopes' => $scopes,
                'meta' => [
                    'facebook_user_id' => $metaUser->getId(),
                    'name' => $metaUser->getName(),
                    'email' => $metaUser->getEmail(),
                    'long_lived' => $longLived,
                    'pages' => $pages,
                    'ad_accounts' => $adAccounts,
                    'selected_ad_account_id' => $selectedAccount !== '' ? $selectedAccount : null,
                ],
                'connected_at' => now(),
            ],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Meta connected. Facebook Page, Instagram, WhatsApp Cloud, and Ads unlock as their scopes are granted.',
        ]);

        if ($request->session()->pull('auth.meta.return') === 'setup') {
            return redirect()->route('settings.setup.show', ['provider' => 'meta', 'step' => 'finish']);
        }

        return redirect()->route('settings.apps.meta');
    }

    /**
     * Granted permissions from /me/permissions — the honest list, not the
     * requested one. Null when the read fails (caller falls back).
     *
     * @return array<int, string>|null
     */
    private function grantedScopes(string $token): ?array
    {
        try {
            $response = Http::timeout(15)->get($this->graphUrl('/me/permissions'), [
                'access_token' => $token,
            ]);

            if (! $response->successful()) {
                return null;
            }

            return collect($response->json('data') ?? [])
                ->filter(fn ($row) => ($row['status'] ?? null) === 'granted')
                ->pluck('permission')
                ->values()
                ->all();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * Best-effort asset discovery (pages, ad accounts). Never fatal.
     *
     * @return array<int, array{id: string, name: string}>
     */
    private function discover(string $token, string $path, bool $allowed): array
    {
        if (! $allowed) {
            return [];
        }

        try {
            $response = Http::timeout(15)->get($this->graphUrl($path), [
                'access_token' => $token,
                'fields' => 'id,name',
                'limit' => 50,
            ]);

            if (! $response->successful()) {
                return [];
            }

            return collect($response->json('data') ?? [])
                ->map(fn ($row) => ['id' => (string) ($row['id'] ?? ''), 'name' => (string) ($row['name'] ?? '')])
                ->filter(fn ($row) => $row['id'] !== '')
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    private function graphUrl(string $path): string
    {
        return 'https://graph.facebook.com/'.MetaAuth::graphVersion().'/'.ltrim($path, '/');
    }
}
