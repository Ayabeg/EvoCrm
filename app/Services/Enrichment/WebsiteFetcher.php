<?php

namespace App\Services\Enrichment;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
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

        for ($redirect = 0; $redirect <= 2; $redirect++) {
            $resolve = $this->publicResolve($normalized);

            if ($resolve === false) {
                return ['ok' => false, 'error' => 'Website address resolved to a blocked or invalid network.'];
            }

            try {
                $options = ['allow_redirects' => false];

                if ($resolve !== []) {
                    $options['resolve'] = $resolve;
                }

                $response = Http::timeout(8)
                    ->withHeaders([
                        'User-Agent' => 'EvoSales-Enrich/1.0 (+https://evotechly.com)',
                        'Accept' => 'text/html,application/xhtml+xml',
                    ])
                    // Validate every hop before following it. Letting Guzzle follow
                    // redirects itself would validate only the user-supplied URL.
                    ->withOptions($options)
                    ->get($normalized);
            } catch (Throwable) {
                return ['ok' => false, 'error' => 'Website fetch failed.', 'retryable' => true];
            }

            if (! in_array($response->status(), [301, 302, 303, 307, 308], true)) {
                break;
            }

            $location = $response->header('Location');
            $normalized = is_string($location)
                ? $this->resolveRedirect($normalized, $location)
                : null;

            if ($normalized === null) {
                return ['ok' => false, 'error' => 'Website redirect points to a blocked or invalid address.'];
            }
        }

        if (in_array($response->status(), [301, 302, 303, 307, 308], true)) {
            return ['ok' => false, 'error' => 'Website returned too many redirects.'];
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

    private function resolveRedirect(string $base, string $location): ?string
    {
        $location = trim($location);

        if ($location === '') {
            return null;
        }

        try {
            $resolved = UriResolver::resolve(new Uri($base), new Uri($location));

            return $this->normalizeUrl((string) $resolved);
        } catch (Throwable) {
            return null;
        }
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

    /**
     * Pin the first public DNS answer for this request. The original hostname
     * remains in the URL so TLS SNI and the Host header stay correct.
     *
     * @return array<string, string>|false
     */
    private function publicResolve(string $url): array|false
    {
        $parts = parse_url($url);
        $host = is_array($parts) ? (string) ($parts['host'] ?? '') : '';

        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
            return [];
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        $addresses = [];

        foreach (is_array($records) ? $records : [] as $record) {
            $address = $record['ip'] ?? $record['ipv6'] ?? null;

            if (! is_string($address) || $address === '') {
                continue;
            }

            if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                return false;
            }

            $addresses[] = $address;
        }

        if ($addresses === []) {
            return [];
        }

        $port = (int) ($parts['port'] ?? (strtolower((string) ($parts['scheme'] ?? 'https')) === 'http' ? 80 : 443));

        return [$host.':'.$port => $addresses[0]];
    }
}
