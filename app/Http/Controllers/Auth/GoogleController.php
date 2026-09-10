<?php

namespace App\Http\Controllers\Auth;

use App\Enums\ConnectorProvider;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Identity\WorkspaceProvisioner;
use App\Support\GoogleAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Fortify;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleController extends Controller
{
    /**
     * Send the user to Google's OAuth consent screen.
     */
    public function redirect(): SymfonyRedirectResponse
    {
        abort_unless(GoogleAuth::enabled(), 404);

        return GoogleAuth::driver()->redirect();
    }

    /**
     * Handle the Google callback: find or create the user by email, mark the
     * email verified, then log in — deferring to the Fortify two-factor
     * challenge when the user already has 2FA enabled.
     *
     * Authenticated reconnects (Gmail / Calendar) reuse this same callback
     * and OAuth client. Extra scopes are requested only from Settings →
     * Connectors, never from the login button.
     */
    public function callback(Request $request): RedirectResponse
    {
        abort_unless(GoogleAuth::enabled(), 404);

        $googleUser = GoogleAuth::driver()->user();

        if ($request->user()) {
            $completed = $this->completeConnectorIfReconnecting($request, $googleUser);

            if ($completed) {
                return $completed;
            }

            return redirect()->intended(config('fortify.home', '/dashboard'));
        }

        $email = $googleUser->getEmail();

        if (! is_string($email) || $email === '') {
            return redirect()->route('login')->with(
                'status',
                'Google did not share an email address. Sign in with your email instead.',
            );
        }

        $user = User::query()->firstWhere('email', $email);

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: Str::before($email, '@'),
                'email' => $email,
                'password' => Str::password(32),
            ]);

            app(WorkspaceProvisioner::class)->provision(
                config('evosales.company', 'Evotechly'),
                $user,
            );

            $user = $user->fresh();
        }

        if (is_null($user->email_verified_at)) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        if ($this->hasTwoFactorEnabled($user)) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => true,
            ]);

            TwoFactorAuthenticationChallenged::dispatch($user);

            return redirect()->route('two-factor.login');
        }

        Auth::login($user, remember: true);

        $request->session()->regenerate();

        return redirect()->intended(config('fortify.home', '/dashboard'));
    }

    /**
     * Mirror Fortify's own check: with confirmation enabled, 2FA counts only
     * once the user has confirmed the setup.
     */
    private function hasTwoFactorEnabled(User $user): bool
    {
        if (is_null($user->two_factor_secret)) {
            return false;
        }

        return ! Fortify::confirmsTwoFactorAuthentication()
            || ! is_null($user->two_factor_confirmed_at);
    }

    private function completeConnectorIfReconnecting(Request $request, SocialiteUser $googleUser): ?RedirectResponse
    {
        $intent = $request->session()->pull('google_connector_intent');

        if (! is_string($intent) || $intent === '') {
            return null;
        }

        $provider = ConnectorProvider::tryFrom($intent);

        if (! $provider instanceof ConnectorProvider || ! $provider->isGoogle()) {
            return null;
        }

        $workspace = $request->user()?->workspace;

        if ($workspace === null) {
            return null;
        }

        app(ConnectorRegistrar::class)->markGoogleConnected($workspace, $provider, [
            'google_email' => $googleUser->getEmail(),
            'scopes' => GoogleAuth::connectorScopes($provider),
            'access_token' => $googleUser->token ?? null,
            'refresh_token' => $googleUser->refreshToken ?? null,
            'expires_at' => isset($googleUser->expiresIn)
                ? now()->addSeconds((int) $googleUser->expiresIn)
                : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $provider->label().' connected on the existing Google OAuth client.',
        ]);

        if ($request->session()->pull('google_setup_return') === 'start') {
            return redirect()->route('settings.setup.show', [
                'provider' => 'start',
                'step' => 'whatsapp',
            ]);
        }

        return redirect()->route('settings.connectors');
    }
}
