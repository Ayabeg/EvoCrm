<?php

namespace App\Support;

final class PosthogPayload
{
    /**
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_key',
        'apikey',
        'authorization',
        'cookie',
        'secret',
        'access_token',
        'refresh_token',
        'resend_api_key',
        'mail_password',
        '_token',
    ];

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function redact(array $payload): array
    {
        $clean = [];

        foreach ($payload as $key => $value) {
            $name = strtolower((string) $key);

            if (self::isSensitive($name)) {
                $clean[$key] = '[redacted]';

                continue;
            }

            if (is_array($value)) {
                /** @var array<string, mixed> $value */
                $clean[$key] = self::redact($value);

                continue;
            }

            $clean[$key] = is_string($value) ? self::redactString($value) : $value;
        }

        return $clean;
    }

    public static function redactString(string $value): string
    {
        $redacted = preg_replace(
            '/(?i)(password|token|secret|api[_-]?key|authorization|access_token|refresh_token)\s*[:=]\s*\S+/',
            '$1=[redacted]',
            $value,
        );

        return is_string($redacted) ? $redacted : $value;
    }

    private static function isSensitive(string $key): bool
    {
        foreach (self::SENSITIVE_KEYS as $sensitive) {
            if ($key === $sensitive || str_contains($key, $sensitive)) {
                return true;
            }
        }

        return false;
    }
}
