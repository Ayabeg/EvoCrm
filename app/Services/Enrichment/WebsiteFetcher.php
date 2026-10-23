<?php

namespace App\Services\Enrichment;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

final class WebsiteFetcher
{
    /**
     * Fetch a public http(s) page. Private hosts are rejected (SSRF).
     *
     * @return array{ok: bool, body?: string, error?: string, status?: int, retryable?: bool, robots_blocked?: bool}
     */
    public function get(string $url): array
    {
        $normalized = $this->normalizeUrl($url);

        if ($normalized === null) {
            return ['ok' => false, 'error' => 'URL is not a public http(s) address.'];
        }

        for ($redirect = 0; $redirect <= 2; $redirect++) {
            $robots = $this->robotsPolicy($normalized);

            if (($robots['allowed'] ?? false) !== true) {
                return [
                    'ok' => false,
                    'error' => $robots['error'] ?? 'Website fetch is disallowed by robots.txt.',
                    'robots_blocked' => true,
                ];
            }

            $request = $this->publicRequestOptions($normalized);

            if ($request === false) {
                return ['ok' => false, 'error' => 'Website address resolved to a blocked or invalid network.'];
            }

            try {
                $response = Http::timeout(8)
                    ->withHeaders([
                        'User-Agent' => 'EvoSales-Enrich/1.0 (+https://evotechly.com)',
                        'Accept' => 'text/html,application/xhtml+xml',
                    ])
                    // Validate every hop before following it. Letting Guzzle follow
                    // redirects itself would validate only the user-supplied URL.
                    ->withOptions($request['options'])
                    ->get($request['url']);
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

    /**
     * Parse a robots policy for a URL without making a network request. This
     * is public for deterministic parser coverage; production fetches use the
     * cached policy returned by robotsPolicy().
     */
    public function pathAllowedByRobots(string $url, string $robotsText): bool
    {
        $parts = parse_url($url);
        $path = is_array($parts) ? (string) ($parts['path'] ?? '/') : '/';
        $rules = $this->robotsRules($robotsText);
        $winner = null;
        $winnerLength = -1;

        foreach ($rules as $rule) {
            if (! $this->robotsRuleMatches((string) $rule['pattern'], $path)) {
                continue;
            }

            $length = strlen((string) $rule['pattern']);

            if ($length > $winnerLength || ($length === $winnerLength && $rule['allow'] === true)) {
                $winner = $rule;
                $winnerLength = $length;
            }
        }

        return ! is_array($winner) || $winner['allow'] === true;
    }

    /**
     * Validate a public URL and pin its first public DNS answer for one
     * outbound request. The hostname remains in the URL for TLS and Host.
     *
     * @return array{url: string, options: array<string, mixed>}|false
     */
    public function publicRequestOptions(string $url): array|false
    {
        $normalized = $this->normalizeUrl($url);

        if ($normalized === null) {
            return false;
        }

        $resolve = $this->publicResolve($normalized);

        if ($resolve === false) {
            return false;
        }

        $options = ['allow_redirects' => false];

        if ($resolve !== []) {
            $options['resolve'] = $resolve;
        }

        return [
            'url' => $normalized,
            'options' => $options,
        ];
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

    /**
     * @return array{allowed: bool, error?: string}
     */
    private function robotsPolicy(string $url): array
    {
        if (! (bool) config('evosales.enrichment.respect_robots', true)
            || (app()->environment('testing') && ! (bool) config('evosales.enrichment.force_robots_in_tests', false))) {
            return ['allowed' => true];
        }

        $parts = parse_url($url);

        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return ['allowed' => false, 'error' => 'Website address has no valid robots policy host.'];
        }

        $origin = strtolower((string) $parts['scheme']).'://'.strtolower((string) $parts['host']);

        if (isset($parts['port'])) {
            $origin .= ':'.(int) $parts['port'];
        }

        $robotsUrl = $origin.'/robots.txt';
        $cacheKey = 'enrichment:robots:'.sha1($origin);
        $policy = Cache::remember($cacheKey, now()->addHour(), function () use ($robotsUrl): array {
            $request = $this->publicRequestOptions($robotsUrl);

            if ($request === false) {
                return ['mode' => 'deny', 'error' => 'Website robots policy points to a blocked network.'];
            }

            try {
                $response = Http::timeout(5)
                    ->withHeaders([
                        'User-Agent' => 'EvoSales-Enrich/1.0 (+https://evotechly.com)',
                        'Accept' => 'text/plain',
                    ])
                    ->withOptions($request['options'])
                    ->get($request['url']);
            } catch (Throwable) {
                return ['mode' => 'deny', 'error' => 'Could not verify the website robots policy.'];
            }

            if ($response->status() === 404) {
                return ['mode' => 'allow'];
            }

            if (! $response->successful()) {
                return ['mode' => 'deny', 'error' => 'Could not verify the website robots policy.'];
            }

            return [
                'mode' => 'rules',
                'text' => substr((string) $response->body(), 0, 64_000),
            ];
        });

        if (($policy['mode'] ?? 'deny') === 'allow') {
            return ['allowed' => true];
        }

        if (($policy['mode'] ?? 'deny') === 'rules'
            && $this->pathAllowedByRobots($url, (string) ($policy['text'] ?? ''))) {
            return ['allowed' => true];
        }

        return [
            'allowed' => false,
            'error' => (string) ($policy['error'] ?? 'Website fetch is disallowed by robots.txt.'),
        ];
    }

    /**
     * @return list<array{allow: bool, pattern: string}>
     */
    private function robotsRules(string $robotsText): array
    {
        $rules = [];
        $agents = [];
        $groupHasDirectives = false;

        foreach (preg_split('/\R/', $robotsText) ?: [] as $line) {
            $line = trim((string) preg_replace('/\s*#.*$/', '', $line));

            if ($line === '' || ! str_contains($line, ':')) {
                continue;
            }

            [$field, $value] = array_map('trim', explode(':', $line, 2));
            $field = strtolower($field);

            if ($field === 'user-agent') {
                if ($groupHasDirectives) {
                    $agents = [];
                    $groupHasDirectives = false;
                }

                $agents[] = strtolower($value);

                continue;
            }

            if (! in_array('*', $agents, true) || ! in_array($field, ['allow', 'disallow'], true)) {
                continue;
            }

            $groupHasDirectives = true;
            $value = trim($value);

            if ($value === '') {
                continue;
            }

            $rules[] = [
                'allow' => $field === 'allow',
                'pattern' => $value,
            ];
        }

        return $rules;
    }

    private function robotsRuleMatches(string $pattern, string $path): bool
    {
        $end = str_ends_with($pattern, '$');
        $pattern = $end ? substr($pattern, 0, -1) : $pattern;
        $regex = preg_quote($pattern, '#');
        $regex = str_replace('\\*', '.*', $regex);

        return preg_match('#^'.$regex.($end ? '$' : '').'#', $path) === 1;
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
