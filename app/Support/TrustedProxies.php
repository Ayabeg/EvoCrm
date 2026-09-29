<?php

namespace App\Support;

final class TrustedProxies
{
    /**
     * @return array<int, string>|string
     */
    public static function at(): array|string
    {
        $raw = null;

        if (function_exists('app') && app()->bound('config')) {
            $configured = config('app.trusted_proxies');
            $raw = is_string($configured) ? $configured : null;
        }

        if ($raw === null) {
            $raw = (string) env('TRUSTED_PROXIES', '*');
        }

        $value = trim($raw);

        if ($value === '' || $value === 'none') {
            return [];
        }

        if ($value === '*') {
            return '*';
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
    }
}
