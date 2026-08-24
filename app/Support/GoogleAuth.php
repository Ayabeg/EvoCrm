<?php

namespace App\Support;

use App\Enums\ConnectorProvider;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleAuth
{
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
        return Socialite::driver('google')
            ->scopes(self::connectorScopes($provider))
            ->redirect();
    }
}
