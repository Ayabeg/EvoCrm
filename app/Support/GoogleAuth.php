<?php

namespace App\Support;

use App\Enums\ConnectorProvider;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuth
{
    public const CALLBACK_PATH = '/auth/google/callback';

    /**
     * Google sign-in is available only when the OAuth client is configured;
     * otherwise the button stays hidden and the routes 404.
     */
    public static function enabled(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    /**
     * Exact Authorized redirect URI Google must have on this OAuth client.
     * Empty or relative GOOGLE_REDIRECT_URI values resolve against APP_URL
     * so Socialite never sends a request-host URL (http vs https, localhost
     * vs production) that Google rejects as redirect_uri_mismatch.
     */
    public static function callbackUrl(): string
    {
        $configured = trim((string) config('services.google.redirect'));

        if (self::isAbsoluteHttpUrl($configured)) {
            return $configured;
        }

        $path = str_starts_with($configured, '/') ? $configured : self::CALLBACK_PATH;

        return rtrim((string) config('app.url'), '/').$path;
    }

    /**
     * Authorized JavaScript origin for the same OAuth client (scheme + host
     * + port, no path).
     */
    public static function javascriptOrigin(): string
    {
        $parts = parse_url(self::callbackUrl());
        $scheme = is_string($parts['scheme'] ?? null) ? $parts['scheme'] : 'https';
        $host = is_string($parts['host'] ?? null) ? $parts['host'] : 'localhost';
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return $scheme.'://'.$host.$port;
    }

    /**
     * Socialite driver pinned to {@see callbackUrl()} for both the authorize
     * redirect and the token exchange. Those two calls must send the same URI.
     *
     * @return Provider|AbstractProvider
     */
    public static function driver()
    {
        return Socialite::driver('google')->redirectUrl(self::callbackUrl());
    }

    /**
     * Extra Gmail / Calendar scopes live on the SAME OAuth client as sign-in.
     * Empty means the current client does not have those APIs enabled — the
     * connectors page shows a reconnect empty state and login is untouched.
     */
    public static function hasConnectorScope(ConnectorProvider $provider): bool
    {
        return filled(self::connectorScope($provider));
    }

    public static function connectorScope(ConnectorProvider $provider): ?string
    {
        $scope = match ($provider) {
            ConnectorProvider::Gmail => config('services.google.gmail_scope'),
            ConnectorProvider::GoogleCalendar => config('services.google.calendar_scope'),
            default => null,
        };

        return is_string($scope) && $scope !== '' ? $scope : null;
    }

    /**
     * @return list<string>
     */
    public static function connectorScopes(ConnectorProvider $provider): array
    {
        $scope = self::connectorScope($provider);

        return $scope === null ? [] : [$scope];
    }

    /**
     * Extra-scope consent on the same Google OAuth client used for sign-in.
     */
    public static function redirectForConnector(ConnectorProvider $provider): SymfonyRedirectResponse
    {
        return self::driver()
            ->scopes(self::connectorScopes($provider))
            ->redirect();
    }

    private static function isAbsoluteHttpUrl(string $value): bool
    {
        if (! str_starts_with($value, 'http://') && ! str_starts_with($value, 'https://')) {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}
