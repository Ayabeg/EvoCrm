<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Evolution\WhatsAppConnector;
use App\Services\Operations\AuditLogger;
use App\Support\MetaAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
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
    public function redirect(Request $request): Response
    {
        $return = $request->query('return');

        if (in_array($return, ['setup', 'start'], true)) {
            $request->session()->put('auth.meta.return', $return);
        }

        if ($request->boolean('popup')) {
            $request->session()->put('auth.meta.popup', true);
        }

        if (! MetaAuth::canStartLogin()) {
            return $this->finish(
                $request,
                false,
                'Facebook login is temporarily unavailable. Evotechly is enabling it — no App ID is needed from you.',
            );
        }

        config([
            'services.meta.client_id' => config('meta.app_id'),
            'services.meta.redirect' => MetaAuth::redirectUri(),
        ]);

        $driver = Socialite::driver('meta')
            ->scopes(MetaAuth::scopes())
            ->usingGraphVersion(MetaAuth::graphVersion())
            ->reRequest();

        if ($request->boolean('popup') || $request->session()->get('auth.meta.popup')) {
            $driver = $driver->with(['display' => 'popup']);
        }

        return $driver->redirect();
    }

    /**
     * Handle the Meta callback: swap the short-lived user token for a
     * long-lived one, read the actually granted permissions, discover pages
     * and ad accounts best-effort, then store the connection encrypted on
     * the workspace.
     */
    public function callback(Request $request): Response
    {
        if (! MetaAuth::enabled()) {
            return $this->finish(
                $request,
                false,
                'Facebook login is temporarily unavailable. Evotechly is enabling it — no App ID is needed from you.',
            );
        }

        try {
            $metaUser = Socialite::driver('meta')
                ->usingGraphVersion(MetaAuth::graphVersion())
                ->user();
        } catch (Throwable $exception) {
            Log::warning('Meta OAuth callback failed', ['error' => $exception->getMessage()]);

            return $this->finish(
                $request,
                false,
                'Meta did not complete the connection. No token was stored.',
            );
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
        $pages = $this->discoverPages($token, in_array('pages_show_list', $scopes, true));
        $adAccounts = $this->discover($token, '/me/adaccounts', in_array('ads_management', $scopes, true) || in_array('ads_read', $scopes, true));
        $instagram = $this->discoverInstagram($pages);

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
                'refresh_token' => $this->encryptedPageSecrets($pages, $existing?->refresh_token),
                'expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
                'scopes' => $scopes,
                'meta' => [
                    'facebook_user_id' => $metaUser->getId(),
                    'name' => $metaUser->getName(),
                    'email' => $metaUser->getEmail(),
                    'long_lived' => $longLived,
                    'pages' => $this->publicPages($pages),
                    'instagram_accounts' => $instagram,
                    'ad_accounts' => $adAccounts,
                    'selected_ad_account_id' => $selectedAccount !== '' ? $selectedAccount : null,
                ],
                'connected_at' => now(),
            ],
        );

        app(AuditLogger::class)->record(
            $workspace,
            'meta.connected',
            'Meta connected for this workspace',
            $request->user(),
            $integration,
            ['long_lived' => $longLived, 'pages' => count($pages), 'ad_accounts' => count($adAccounts)],
        );

        app(ProductAnalytics::class)->capture(ProductAnalytics::INTEGRATION_CONNECTED, [
            'provider' => Integration::PROVIDER_META,
            'pages' => count($pages),
            'ad_accounts' => count($adAccounts),
        ], $request->user(), $workspace);

        try {
            $whatsapp = app(WhatsAppConnector::class)->provisionBusinessIfReady($workspace->fresh());
            $whatsappConnected = (bool) ($whatsapp['connected'] ?? false);
        } catch (Throwable $exception) {
            Log::info('WhatsApp Business auto-provision skipped', ['error' => $exception->getMessage()]);
            $whatsappConnected = false;
        }

        return $this->finish(
            $request,
            true,
            $whatsappConnected
                ? 'Facebook login connected WhatsApp Business automatically.'
                : 'Meta connected. Facebook Page, Instagram, WhatsApp, and Ads unlock as their scopes are granted.',
        );
    }

    private function finish(Request $request, bool $ok, string $message): Response
    {
        $fromFacebook = str_contains((string) $request->headers->get('referer'), 'facebook.com');
        $popup = (bool) $request->session()->pull('auth.meta.popup', false) || $fromFacebook;
        $setup = $request->session()->pull('auth.meta.return');

        if ($popup) {
            return response()->view('oauth.popup-complete', [
                'provider' => 'meta',
                'ok' => $ok,
            ]);
        }

        Inertia::flash('toast', [
            'type' => $ok ? 'success' : 'error',
            'message' => $message,
        ]);

        if ($setup === 'start') {
            return redirect()->route('settings.setup.show', [
                'provider' => 'start',
                'step' => $ok ? 'sms' : 'whatsapp',
            ]);
        }

        if ($setup === 'setup') {
            return redirect()->route('settings.setup.show', [
                'provider' => 'meta',
                'step' => $ok ? 'finish' : 'connect',
            ]);
        }

        return $ok
            ? redirect()->route('settings.apps.meta')
            : redirect()->route('settings.apps');
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
     * Page access tokens are stored server-side only and never sent to the UI.
     *
     * @return array<int, array{id: string, name: string, access_token?: string, instagram_business_account?: array<string, mixed>}>
     */
    private function discover(string $token, string $path, bool $allowed): array
    {
        if (! $allowed) {
            return [];
        }

        try {
            $response = Http::timeout(15)->get($this->graphUrl($path), [
                'access_token' => $token,
                'fields' => 'id,name,account_id,currency,timezone_name',
                'limit' => 50,
            ]);

            if (! $response->successful()) {
                return [];
            }

            return collect($response->json('data') ?? [])
                ->map(fn ($row) => [
                    'id' => (string) ($row['id'] ?? $row['account_id'] ?? ''),
                    'name' => (string) ($row['name'] ?? ''),
                    'currency' => $row['currency'] ?? null,
                    'timezone' => $row['timezone_name'] ?? null,
                ])
                ->filter(fn ($row) => $row['id'] !== '')
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @return array<int, array{id: string, name: string, access_token?: string}>
     */
    private function discoverPages(string $token, bool $allowed): array
    {
        if (! $allowed) {
            return [];
        }

        try {
            $response = Http::timeout(15)->get($this->graphUrl('/me/accounts'), [
                'access_token' => $token,
                'fields' => 'id,name,access_token,instagram_business_account{id,username}',
                'limit' => 50,
            ]);

            if (! $response->successful()) {
                return [];
            }

            return collect($response->json('data') ?? [])
                ->map(fn ($row) => array_filter([
                    'id' => (string) ($row['id'] ?? ''),
                    'name' => (string) ($row['name'] ?? ''),
                    'access_token' => filled($row['access_token'] ?? null) ? (string) $row['access_token'] : null,
                    'instagram_business_account' => $row['instagram_business_account'] ?? null,
                ], fn ($value) => $value !== null && $value !== ''))
                ->filter(fn ($row) => ($row['id'] ?? '') !== '')
                ->values()
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $pages
     * @return array<int, array{id: string, name: string, page_id: string}>
     */
    private function discoverInstagram(array $pages): array
    {
        $accounts = [];

        foreach ($pages as $page) {
            $ig = $page['instagram_business_account'] ?? null;
            if (! is_array($ig) || ! filled($ig['id'] ?? null)) {
                continue;
            }

            $accounts[] = [
                'id' => (string) $ig['id'],
                'name' => (string) ($ig['username'] ?? $ig['id']),
                'page_id' => (string) ($page['id'] ?? ''),
            ];
        }

        return $accounts;
    }

    /**
     * Persist page identity only. Page tokens stay in the encrypted
     * refresh_token column, never in the public meta JSON.
     *
     * @param  array<int, array<string, mixed>>  $pages
     * @return array<int, array{id: string, name: string}>
     */
    private function publicPages(array $pages): array
    {
        return collect($pages)
            ->map(fn ($page) => [
                'id' => (string) ($page['id'] ?? ''),
                'name' => (string) ($page['name'] ?? ''),
            ])
            ->filter(fn ($page) => $page['id'] !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $pages
     */
    private function encryptedPageSecrets(array $pages, ?string $existing): ?string
    {
        $secrets = is_string($existing) && $existing !== ''
            ? (json_decode($existing, true) ?: [])
            : [];

        if (! is_array($secrets)) {
            $secrets = [];
        }

        $pageTokens = [];

        foreach ($pages as $page) {
            if (! filled($page['id'] ?? null) || ! filled($page['access_token'] ?? null)) {
                continue;
            }

            $pageTokens[(string) $page['id']] = (string) $page['access_token'];
        }

        if ($pageTokens !== []) {
            $secrets['page_tokens'] = $pageTokens;
        }

        return $secrets === [] ? null : json_encode($secrets, JSON_THROW_ON_ERROR);
    }

    private function graphUrl(string $path): string
    {
        return 'https://graph.facebook.com/'.MetaAuth::graphVersion().'/'.ltrim($path, '/');
    }
}
