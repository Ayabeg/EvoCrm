<?php

namespace App\Support;

use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

class AppleAuth
{
    public const CALLBACK_PATH = '/auth/apple/callback';

    /**
     * Apple sign-in is configured only when the Services ID and the .p8
     * signing key are present. The button stays visible either way; the
     * routes return to /login with a status instead of 500ing.
     */
    public static function enabled(): bool
    {
        return filled(config('services.apple.client_id'))
            && filled(config('services.apple.team_id'))
            && filled(config('services.apple.key_id'))
            && filled(config('services.apple.private_key'));
    }

    /**
     * Exact Return URL Apple must have on the Services ID. Empty or relative
     * APPLE_REDIRECT_URI values resolve against APP_URL so Socialite never
     * sends a request-host URL that Apple rejects.
     */
    public static function callbackUrl(): string
    {
        $configured = trim((string) config('services.apple.redirect'));

        if (self::isAbsoluteHttpUrl($configured)) {
            return $configured;
        }

        $path = str_starts_with($configured, '/') ? $configured : self::CALLBACK_PATH;

        return rtrim((string) config('app.url'), '/').$path;
    }

    /**
     * Socialite Apple driver pinned to {@see callbackUrl()}.
     *
     * Apple posts the callback as a cross-site form_post. Stateless +
     * cookieNonce keeps SESSION_SAME_SITE=lax for the rest of the app
     * and binds the nonce to the browser that started the login.
     *
     * @return Provider|AbstractProvider
     */
    public static function driver()
    {
        return Socialite::driver('apple')
            ->redirectUrl(self::callbackUrl())
            ->stateless()
            ->cookieNonce();
    }

    private static function isAbsoluteHttpUrl(string $value): bool
    {
        if (! str_starts_with($value, 'http://') && ! str_starts_with($value, 'https://')) {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}
