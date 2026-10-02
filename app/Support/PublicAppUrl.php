<?php

namespace App\Support;

/**
 * Customer-facing origin for booking / share links.
 * Loopback APP_URL must never appear in the golden cabinet.
 */
class PublicAppUrl
{
    public static function origin(): string
    {
        $appUrl = rtrim((string) config('app.url'), '/');
        $host = parse_url($appUrl, PHP_URL_HOST) ?: '';

        if (! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
            return $appUrl;
        }

        $public = config('app.public_origin');

        if (is_string($public) && $public !== '') {
            return rtrim($public, '/');
        }

        return rtrim((string) config('app.url'), '/');
    }

    public static function to(string $path): string
    {
        return self::origin().'/'.ltrim($path, '/');
    }
}
