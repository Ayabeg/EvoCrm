<?php

namespace App\Services\Enrichment;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Adapter for an approved email-verification service with a normalized JSON
 * response. The service must return a status/result such as valid, invalid,
 * catch_all, unknown, temporary_failure, or unsupported.
 */
final class HttpEmailVerificationProvider implements EmailVerificationProvider
{
    public function name(): string
    {
        return (string) config('evosales.enrichment.email_verification_provider', 'http');
    }

    public function verify(string $email): array
    {
        $url = trim((string) config('evosales.enrichment.email_verification_url', ''));
        $apiKey = trim((string) config('evosales.enrichment.email_verification_api_key', ''));

        if ($url === '' || $apiKey === '') {
            return [
                'status' => 'unsupported',
                'confidence' => 0.0,
                'raw' => ['provider' => $this->name()],
                'error' => 'Email verification provider credentials are not configured.',
            ];
        }

        try {
            $response = Http::timeout(max(1, (int) config('evosales.enrichment.email_verification_timeout', 8)))
                ->withToken($apiKey)
                ->acceptJson()
                ->post($url, ['email' => strtolower(trim($email))]);
        } catch (Throwable $exception) {
            throw new TransientEnrichmentException('Email verification provider request failed.', previous: $exception);
        }

        if ($response->status() === 429 || $response->serverError()) {
            throw new TransientEnrichmentException('Email verification provider is temporarily unavailable.');
        }

        if (! $response->successful()) {
            return [
                'status' => 'unsupported',
                'confidence' => 0.0,
                'raw' => [
                    'provider' => $this->name(),
                    'http_status' => $response->status(),
                ],
                'error' => 'Email verification provider returned HTTP '.$response->status().'.',
            ];
        }

        $payload = $response->json();
        $payload = is_array($payload) ? $payload : [];
        $providerStatus = $payload['status'] ?? $payload['result'] ?? $payload['verdict'] ?? null;

        if (($payload['is_catch_all'] ?? false) === true || ($payload['catch_all'] ?? false) === true) {
            $providerStatus = 'catch_all';
        } elseif (($payload['is_valid'] ?? null) === true && $providerStatus === null) {
            $providerStatus = 'valid';
        } elseif (($payload['is_valid'] ?? null) === false && $providerStatus === null) {
            $providerStatus = 'invalid';
        }

        $status = $this->normalizeStatus($providerStatus);
        $raw = array_filter([
            'provider' => $this->name(),
            'http_status' => $response->status(),
            'provider_status' => is_scalar($providerStatus) ? (string) $providerStatus : null,
            'is_valid' => is_bool($payload['is_valid'] ?? null) ? $payload['is_valid'] : null,
            'is_catch_all' => is_bool($payload['is_catch_all'] ?? null) ? $payload['is_catch_all'] : null,
            'reason' => is_string($payload['reason'] ?? null) ? mb_substr($payload['reason'], 0, 300) : null,
        ], static fn (mixed $value): bool => $value !== null);

        return [
            'status' => $status,
            'confidence' => $this->confidence($status),
            'raw' => $raw,
            'error' => is_string($payload['error'] ?? null)
                ? mb_substr($payload['error'], 0, 300)
                : (is_string($payload['message'] ?? null) ? mb_substr($payload['message'], 0, 300) : null),
        ];
    }

    private function normalizeStatus(mixed $status): string
    {
        return match (strtolower(trim((string) $status))) {
            'valid', 'verified', 'deliverable', 'safe' => 'verified',
            'invalid', 'undeliverable', 'do_not_mail' => 'invalid',
            'catch_all', 'catch-all', 'accept_all', 'accept-all' => 'catch_all',
            'temporary_failure', 'temporary-failure', 'retry', 'rate_limited' => 'temporary_failure',
            'unsupported', 'uncheckable' => 'unsupported',
            default => 'unknown',
        };
    }

    private function confidence(string $status): float
    {
        return match ($status) {
            'verified', 'invalid' => 0.99,
            'catch_all' => 0.75,
            'unknown' => 0.25,
            default => 0.0,
        };
    }
}
