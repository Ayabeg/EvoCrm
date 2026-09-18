<?php

namespace App\Services\Ai;

use App\Services\Crm\WorkflowExecutionRedactor;

/**
 * Secrets never enter an LLM prompt — including for owners and admins.
 */
final class AskEvoSecretRedactor
{
    /**
     * @var list<string>
     */
    public const SECRET_KEYS = [
        ...WorkflowExecutionRedactor::SECRET_KEYS,
        'public_token',
        'token_expires_at',
        'accepted_ip',
        'oauth',
        'oauth_setup',
        'client_id',
        'app_secret',
        'webhook',
        'webhook_url',
        'callback',
        'smtp_password',
        'mail_password',
        'imap_password',
        'payload',
        'config',
        'snapshot_html',
        'snapshot',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'password_hash',
        'openai',
        'anthropic',
        'openrouter',
    ];

    public function isSecretKey(string $key): bool
    {
        $normalized = strtolower(str_replace(['-', ' '], '_', $key));

        foreach (self::SECRET_KEYS as $secret) {
            if ($normalized === $secret || str_contains($normalized, $secret)) {
                return true;
            }
        }

        return false;
    }

    public function redactText(string $value): string
    {
        $text = preg_replace('/sk-[A-Za-z0-9_\-]{10,}/', '[redacted-key]', $value) ?? $value;
        $text = preg_replace('/(?i)(authorization|bearer|token|api[_-]?key|secret|password)\s*[:=]\s*\S+/', '[redacted-secret]', $text) ?? $text;
        $text = preg_replace('/[A-Z0-9._%+\-]+:[^@\s]+@/i', '[redacted]@', $text) ?? $text;

        return $text;
    }

    /**
     * @param  list<array{label: string, value: string}>  $facts
     * @return list<array{label: string, value: string}>
     */
    public function facts(array $facts): array
    {
        $clean = [];

        foreach ($facts as $fact) {
            $label = $fact['label'];
            $value = $fact['value'];

            if ($this->isSecretKey($label)) {
                continue;
            }

            $clean[] = [
                'label' => $label,
                'value' => $this->redactText($value),
            ];
        }

        return $clean;
    }
}
