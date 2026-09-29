<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use App\Support\AppleAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Fortify;
use Laravel\Socialite\Two\InvalidStateException;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class AppleController extends Controller
{
    /**
     * Send the user to Apple's Sign in with Apple screen, or back to login
     * when the Services ID is not configured.
     */
    public function redirect(Request $request): SymfonyRedirectResponse
    {
        if (! AppleAuth::enabled()) {
            return $this->unavailable();
        }

        $callbackHost = parse_url(AppleAuth::callbackUrl(), PHP_URL_HOST);

        if (is_string($callbackHost) && $callbackHost !== $request->getHost()) {
            return redirect()->away('https://'.$callbackHost.'/auth/apple');
        }

        try {
            return AppleAuth::driver()->redirect();
        } catch (Throwable $e) {
            report($e);

            return $this->unavailable();
        }
    }

    /**
     * Handle the Apple callback: find or create the user by email, mark the
     * email verified, then log in — deferring to the Fortify two-factor
     * challenge when the user already has 2FA enabled. Same linking rules
     * as Google: email only, no provider-id column.
     */
    public function callback(Request $request): RedirectResponse
    {
        if (! AppleAuth::enabled()) {
            return $this->unavailable();
        }

        try {
            $appleUser = AppleAuth::driver()->user();
        } catch (InvalidStateException) {
            return redirect()->route('login')->with(
                'status',
                __('Apple sign-in could not be completed. Start again from this page and try once more.'),
            );
        } catch (Throwable $e) {
            report($e);

            return $this->unavailable();
        }

        $email = $appleUser->getEmail();

        if (! is_string($email) || $email === '') {
            return redirect()->route('login')->with(
                'status',
                __('Apple did not share an email address. Sign in with your email instead.'),
            );
        }

        $user = User::query()->firstWhere('email', $email);

        if (! $user) {
            $user = User::create([
                'name' => $appleUser->getName() ?: $appleUser->getNickname() ?: Str::before($email, '@'),
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

    private function unavailable(): RedirectResponse
    {
        return redirect()->route('login')->with(
            'status',
            __('Apple sign-in isn\'t available yet.'),
        );
    }
}
