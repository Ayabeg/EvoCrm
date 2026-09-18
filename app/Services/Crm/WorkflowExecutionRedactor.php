<?php

namespace App\Services\Crm;

/**
 * Explicit sanitization contract for workflow execution inspection.
 *
 * Secrets are stripped at write time. Record PII is gated again at present time.
 */
class WorkflowExecutionRedactor
{
    public const MAX_ERROR_CHARS = 240;

    public const MAX_TEXT_CHARS = 180;

    /**
     * @var list<string>
     */
    public const SECRET_KEYS = [
        'password',
        'passwd',
        'secret',
        'token',
        'api_key',
        'apikey',
        'authorization',
        'auth',
        'bearer',
        'credential',
        'credentials',
        'private_key',
        'access_token',
        'refresh_token',
        'mail_password',
        'smtp_password',
        'webhook_secret',
        'hmac',
        'client_secret',
        'x-api-key',
    ];

    /**
     * @var list<string>
     */
    public const SAFE_PARAMETER_KEYS = [
        'subject',
        'body',
        'due_in_days',
        'sequence_id',
        'entity',
        'field',
        'value',
        'title',
        'amount_cents',
        'owner_id',
        'user_id',
        'url',
        'stage_slug',
    ];

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function redactParameters(array $config): array
    {
        $safe = [];

        foreach (self::SAFE_PARAMETER_KEYS as $key) {
            if (! array_key_exists($key, $config)) {
                continue;
            }

            $safe[$key] = $this->redactValue($key, $config[$key]);
        }

        return $safe;
    }

    /**
     * @param  array<string, mixed>|null  $result
     * @return array<string, mixed>|null
     */
    public function redactResult(?array $result): ?array
    {
        if ($result === null) {
            return null;
        }

        $clean = [];

        foreach ($result as $key => $value) {
            if (! is_string($key) || $this->isSecretKey($key)) {
                continue;
            }

            $clean[$key] = $this->redactValue((string) $key, $value);
        }

        return $clean;
    }

    public function redactError(?string $message): ?string
    {
        if ($message === null || $message === '') {
            return null;
        }

        $text = preg_replace('/[A-Z0-9._%+\-]+:[^@\s]+@/i', '[redacted]@', $message) ?? $message;
        $text = preg_replace('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', '[redacted-email]', $text) ?? $text;
        $text = preg_replace('/https?:\/\/[^\s]+/i', '[redacted-url]', $text) ?? $text;
        $text = preg_replace('/(?i)(authorization|bearer|token|api[_-]?key|secret)\s*[:=]\s*\S+/', '[redacted-secret]', $text) ?? $text;

        return $this->truncate($text, self::MAX_ERROR_CHARS);
    }

    public function redactUrl(?string $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $parts = parse_url($url);

        if (! is_array($parts) || ! isset($parts['host'])) {
            return '[redacted-url]';
        }

        $scheme = isset($parts['scheme']) ? strtolower((string) $parts['scheme']).'://' : '';
        $host = (string) $parts['host'];
        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $path = isset($parts['path']) ? (string) $parts['path'] : '';

        return $scheme.$host.$port.$path;
    }

    public function hideRecordPii(mixed $value): mixed
    {
        if (is_string($value)) {
            return $this->truncate($this->redactError($value) ?? '', self::MAX_TEXT_CHARS);
        }

        return null;
    }

    private function redactValue(string $key, mixed $value): mixed
    {
        if ($this->isSecretKey($key)) {
            return '[redacted]';
        }

        if ($key === 'url' && is_string($value)) {
            return $this->redactUrl($value);
        }

        if (is_string($value)) {
            return $this->truncate($value, self::MAX_TEXT_CHARS);
        }

        if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
            return $value;
        }

        return null;
    }

    private function isSecretKey(string $key): bool
    {
        $normalized = strtolower(str_replace(['-', ' '], '_', $key));

        foreach (self::SECRET_KEYS as $secret) {
            if ($normalized === $secret || str_contains($normalized, $secret)) {
                return true;
            }
        }

        return false;
    }

    private function truncate(string $value, int $max): string
    {
        $value = trim($value);

        if (mb_strlen($value) <= $max) {
            return $value;
        }

        return rtrim(mb_substr($value, 0, $max - 1)).'…';
    }
}
