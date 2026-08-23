<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;
use App\Support\GoogleAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Fortify;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleController extends Controller
{
    /**
     * Send the user to Google's OAuth consent screen.
     */
    public function redirect(): SymfonyRedirectResponse
    {
        abort_unless(GoogleAuth::enabled(), 404);

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the Google callback: find or create the user by email, mark the
     * email verified, then log in — deferring to the Fortify two-factor
     * challenge when the user already has 2FA enabled.
     */
    public function callback(Request $request): RedirectResponse
    {
        abort_unless(GoogleAuth::enabled(), 404);

        $googleUser = Socialite::driver('google')->user();

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
}
