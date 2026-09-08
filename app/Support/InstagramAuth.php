<?php

namespace App\Support;

use App\Models\Integration;

/**
 * Business Login for Instagram — official Authorization Window.
 *
 * Sources:
 * https://developers.facebook.com/documentation/instagram-platform/reference/oauth-authorize
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 */
class InstagramAuth
{
    /**
     * Instagram Business Login is available only when an Instagram App ID
     * and secret are configured. Falls back to META_APP_ID / META_APP_SECRET.
     * Empty credentials keep Connect disabled and /auth/instagram 404s.
     */
    public static function enabled(): bool
    {
        return filled(static::appId()) && filled(static::appSecret());
    }

    public static function appId(): string
    {
        return (string) (config('meta.instagram_app_id') ?: config('meta.app_id') ?: '');
    }

    public static function appSecret(): string
    {
        return (string) (config('meta.instagram_app_secret') ?: config('meta.app_secret') ?: '');
    }

    public static function redirectUri(): string
    {
        $configured = (string) config('meta.instagram_redirect_uri', '');

        return $configured !== '' ? $configured : url('/auth/instagram/callback');
    }

    /**
     * @return list<string>
     */
    public static function scopes(): array
    {
        /** @var list<string> $scopes */
        $scopes = config('meta.instagram_scopes', [
            'instagram_business_basic',
            'instagram_business_manage_messages',
            'instagram_business_manage_comments',
        ]);

        return $scopes;
    }

    /**
     * GET https://www.instagram.com/oauth/authorize
     * client_id, redirect_uri, response_type=code, scope, state.
     */
    public static function authorizeUrl(string $state): string
    {
        return 'https://www.instagram.com/oauth/authorize?'.http_build_query([
            'client_id' => static::appId(),
            'redirect_uri' => static::redirectUri(),
            'response_type' => 'code',
            'scope' => implode(',', static::scopes()),
            'state' => $state,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    /**
     * Meta appends `#_` to the redirect URI. It is not part of the code.
     */
    public static function normalizeCode(?string $code): string
    {
        $value = (string) $code;

        if (str_contains($value, '#')) {
            $value = strstr($value, '#', true) ?: $value;
        }

        return rtrim($value);
    }

    /**
     * @return array<int, array{key: string, label: string, scope: string, granted: bool}>
     */
    public static function unlocks(?Integration $integration): array
    {
        $granted = fn (string $scope): bool => $integration !== null
            && in_array($scope, $integration->scopes ?? [], true);

        return [
            [
                'key' => 'instagram',
                'label' => 'Instagram',
                'scope' => 'instagram_business_basic',
                'granted' => $granted('instagram_business_basic'),
            ],
            [
                'key' => 'instagram_messages',
                'label' => 'Instagram messages',
                'scope' => 'instagram_business_manage_messages',
                'granted' => $granted('instagram_business_manage_messages'),
            ],
        ];
    }
}
