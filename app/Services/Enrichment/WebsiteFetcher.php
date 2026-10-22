<?php

namespace App\Services\Enrichment;

use Illuminate\Support\Facades\Http;
use Throwable;

final class WebsiteFetcher
{
    /**
     * Fetch a public http(s) page. Private hosts are rejected (SSRF).
     *
     * @return array{ok: bool, body?: string, error?: string, status?: int, retryable?: bool}
     */
    public function get(string $url): array
    {
        $normalized = $this->normalizeUrl($url);

        if ($normalized === null) {
            return ['ok' => false, 'error' => 'URL is not a public http(s) address.'];
        }

        try {
            $response = Http::timeout(8)
                ->withHeaders([
                    'User-Agent' => 'EvoSales-Enrich/1.0 (+https://evotechly.com)',
                    'Accept' => 'text/html,application/xhtml+xml',
                ])
                ->withOptions(['allow_redirects' => ['max' => 2]])
                ->get($normalized);
        } catch (Throwable) {
            return ['ok' => false, 'error' => 'Website fetch failed.', 'retryable' => true];
        }

        if (! $response->successful()) {
            $status = $response->status();

            return [
                'ok' => false,
                'error' => 'Website returned HTTP '.$status.'.',
                'status' => $status,
                'retryable' => $status === 429 || $status >= 500,
            ];
        }

        $body = substr((string) $response->body(), 0, 512_000);

        return ['ok' => true, 'body' => $body, 'status' => $response->status()];
    }

    public function normalizeUrl(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = trim($raw);

        if ($value === '') {
            return null;
        }

        if (! preg_match('#^https?://#i', $value)) {
            $value = 'https://'.preg_replace('#^//#', '', $value);
        }

        $parts = parse_url($value);

        if (! is_array($parts) || ! isset($parts['host'], $parts['scheme'])) {
            return null;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);

        if ($host === '' || ! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        if ($this->isBlockedHost($host)) {
            return null;
        }

        $path = $parts['path'] ?? '';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';

        return $scheme.'://'.$host.$path.$query;
    }

    private function isBlockedHost(string $host): bool
    {
        if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            return true;
        }

        if (str_ends_with($host, '.localhost') || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return true;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
        }

        return false;
    }
}
