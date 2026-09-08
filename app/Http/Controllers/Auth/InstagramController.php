<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Support\InstagramAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Instagram Business Login popup.
 *
 * Authorization Window: GET https://www.instagram.com/oauth/authorize
 * Token: POST https://api.instagram.com/oauth/access_token
 * Long-lived: GET https://graph.instagram.com/access_token
 *
 * Instagram User tokens are not Marketing API tokens. Ads still use
 * Facebook Login. This is not Tech Provider / Embedded Signup.
 */
class InstagramController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        abort_unless(InstagramAuth::enabled(), 404);

        $state = Str::random(40);
        $request->session()->put('auth.instagram.state', $state);

        if ($request->boolean('popup')) {
            $request->session()->put('auth.instagram.popup', true);
        }

        return redirect()->away(InstagramAuth::authorizeUrl($state));
    }

    public function callback(Request $request): Response
    {
        abort_unless(InstagramAuth::enabled(), 404);

        $expected = (string) $request->session()->pull('auth.instagram.state', '');
        $popup = (bool) $request->session()->pull('auth.instagram.popup', false);
        $state = (string) $request->query('state', '');

        if ($request->filled('error')) {
            return $this->finish($request, $popup, false, 'Instagram did not complete the connection. No token was stored.');
        }

        if ($expected === '' || ! hash_equals($expected, $state)) {
            return $this->finish($request, $popup, false, 'Instagram login state did not match. Try Connect again.');
        }

        $code = InstagramAuth::normalizeCode($request->query('code'));

        if ($code === '') {
            return $this->finish($request, $popup, false, 'Instagram did not return an authorization code.');
        }

        try {
            $short = $this->exchangeCode($code);
        } catch (Throwable $exception) {
            Log::warning('Instagram code exchange failed', ['error' => $exception->getMessage()]);

            return $this->finish($request, $popup, false, 'Instagram did not complete the connection. No token was stored.');
        }

        $token = (string) ($short['access_token'] ?? '');
        $userId = (string) ($short['user_id'] ?? '');
        $scopes = $this->parsePermissions($short['permissions'] ?? InstagramAuth::scopes());
        $expiresIn = is_numeric($short['expires_in'] ?? null) ? (int) $short['expires_in'] : 3600;
        $longLived = false;

        try {
            $long = $this->exchangeLongLived($token);

            if (filled($long['access_token'] ?? null)) {
                $token = (string) $long['access_token'];
                $expiresIn = is_numeric($long['expires_in'] ?? null) ? (int) $long['expires_in'] : $expiresIn;
                $longLived = true;
            }
        } catch (Throwable $exception) {
            Log::info('Instagram long-lived token exchange skipped', ['error' => $exception->getMessage()]);
        }

        if ($token === '') {
            return $this->finish($request, $popup, false, 'Instagram did not complete the connection. No token was stored.');
        }

        $workspace = $request->user()->workspace;

        Integration::query()->updateOrCreate(
            ['workspace_id' => $workspace->id, 'provider' => Integration::PROVIDER_INSTAGRAM],
            [
                'status' => 'connected',
                'access_token' => $token,
                'expires_at' => now()->addSeconds($expiresIn),
                'scopes' => $scopes,
                'meta' => [
                    'instagram_user_id' => $userId !== '' ? $userId : null,
                    'login' => 'instagram',
                    'long_lived' => $longLived,
                ],
                'connected_at' => now(),
            ],
        );

        return $this->finish($request, $popup, true, 'Instagram connected. Ads still need Facebook Login — this is not a Marketing API token.');
    }

    /**
     * @return array<string, mixed>
     */
    private function exchangeCode(string $code): array
    {
        $response = Http::asForm()->timeout(15)->post('https://api.instagram.com/oauth/access_token', [
            'client_id' => InstagramAuth::appId(),
            'client_secret' => InstagramAuth::appSecret(),
            'grant_type' => 'authorization_code',
            'redirect_uri' => InstagramAuth::redirectUri(),
            'code' => $code,
        ]);

        $response->throw();

        $json = $response->json() ?? [];
        $row = is_array($json['data'][0] ?? null) ? $json['data'][0] : $json;

        return is_array($row) ? $row : [];
    }

    /**
     * @return array<string, mixed>
     */
    private function exchangeLongLived(string $shortLived): array
    {
        $response = Http::timeout(15)->get('https://graph.instagram.com/access_token', [
            'grant_type' => 'ig_exchange_token',
            'client_secret' => InstagramAuth::appSecret(),
            'access_token' => $shortLived,
        ]);

        $response->throw();

        return $response->json() ?? [];
    }

    /**
     * @return list<string>
     */
    private function parsePermissions(mixed $permissions): array
    {
        if (is_string($permissions)) {
            return array_values(array_filter(array_map('trim', explode(',', $permissions))));
        }

        if (is_array($permissions)) {
            return array_values(array_map('strval', $permissions));
        }

        return InstagramAuth::scopes();
    }

    private function finish(Request $request, bool $popup, bool $ok, string $message): Response
    {
        if ($popup) {
            return response()->view('oauth.popup-complete', [
                'provider' => 'instagram',
                'ok' => $ok,
            ]);
        }

        Inertia::flash('toast', [
            'type' => $ok ? 'success' : 'error',
            'message' => $message,
        ]);

        return redirect()->route('settings.apps');
    }
}
