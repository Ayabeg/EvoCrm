<?php

namespace App\Services\Enrichment;

use Throwable;

/**
 * Safe local evidence provider. DNS can show that a domain publishes MX
 * records, but it cannot prove that a particular mailbox exists.
 */
final class DnsEmailVerificationProvider implements EmailVerificationProvider
{
    public function name(): string
    {
        return 'dns';
    }

    public function verify(string $email): array
    {
        $email = strtolower(trim($email));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 'invalid',
                'confidence' => 1.0,
                'raw' => [
                    'provider' => $this->name(),
                    'method' => 'syntax',
                    'email' => $email,
                ],
                'error' => 'Email address failed syntax validation.',
            ];
        }

        $domain = strtolower((string) substr(strrchr($email, '@') ?: '', 1));

        try {
            $records = dns_get_record($domain, DNS_MX);
        } catch (Throwable $exception) {
            return [
                'status' => 'temporary_failure',
                'confidence' => 0.0,
                'raw' => [
                    'provider' => $this->name(),
                    'method' => 'dns_mx',
                    'domain' => $domain,
                ],
                'error' => 'DNS verification failed: '.mb_substr($exception->getMessage(), 0, 300),
            ];
        }

        $mx = is_array($records)
            ? array_values(array_filter(array_map(
                static fn (mixed $record): ?array => is_array($record) && is_string($record['target'] ?? null)
                    ? [
                        'target' => strtolower(rtrim($record['target'], '.')),
                        'priority' => (int) ($record['pri'] ?? $record['priority'] ?? 0),
                    ]
                    : null,
                $records,
            )))
            : [];

        if ($mx === []) {
            return [
                'status' => 'not_found',
                'confidence' => 0.85,
                'raw' => [
                    'provider' => $this->name(),
                    'method' => 'dns_mx',
                    'domain' => $domain,
                    'mx' => [],
                ],
                'error' => 'Domain has no observable MX record.',
            ];
        }

        return [
            'status' => 'evidence_supported',
            'confidence' => 0.55,
            'raw' => [
                'provider' => $this->name(),
                'method' => 'dns_mx',
                'domain' => $domain,
                'mx' => $mx,
                'mailbox_proof' => false,
            ],
        ];
    }
}
