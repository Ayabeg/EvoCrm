<?php

namespace App\Services\Meta;

use App\Support\MetaAuth;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Official Graph API client. Tokens never appear in logs.
 *
 * @see https://developers.facebook.com/docs/graph-api/overview
 */
class MetaGraphClient
{
    public const TOKEN_EXPIRED = 'token_expired';

    public const RATE_LIMITED = 'rate_limited';

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    public function get(string $token, string $path, array $query = []): array
    {
        return $this->request($token, 'get', $path, $query);
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    public function post(string $token, string $path, array $body = []): array
    {
        return $this->request($token, 'post', $path, $body);
    }

    /**
     * Follow Graph paging until exhausted. Restarts are safe because callers
     * upsert by external id.
     *
     * @param  array<string, mixed>  $query
     * @return list<array<string, mixed>>
     */
    public function paginate(string $token, string $path, array $query = [], int $maxPages = 50): array
    {
        $rows = [];
        $page = 0;
        $next = $this->url($path);
        $params = $query;

        while ($next !== null && $page < $maxPages) {
            $response = $page === 0
                ? $this->send($token, 'get', $next, $params)
                : $this->sendAbsolute($token, $next);

            $data = $response['data'] ?? [];
            if (is_array($data)) {
                foreach ($data as $row) {
                    if (is_array($row)) {
                        $rows[] = $row;
                    }
                }
            }

            $next = is_string($response['paging']['next'] ?? null)
                ? (string) $response['paging']['next']
                : null;
            $params = [];
            $page++;
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function request(string $token, string $method, string $path, array $payload = []): array
    {
        return $this->send($token, $method, $this->url($path), $payload);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function send(string $token, string $method, string $url, array $payload = []): array
    {
        $attempt = 0;
        $maxAttempts = 4;

        while (true) {
            $attempt++;

            try {
                $pending = $this->client($token);
                $response = $method === 'post'
                    ? $pending->asJson()->post($url, $payload)
                    : $pending->get($url, $payload);

                if ($this->isRateLimited($response) && $attempt < $maxAttempts) {
                    $this->backoff($attempt, $response);

                    continue;
                }

                if ($this->isTransient($response) && $attempt < $maxAttempts) {
                    $this->backoff($attempt, $response);

                    continue;
                }

                if ($this->isTokenFailure($response)) {
                    throw new RuntimeException(self::TOKEN_EXPIRED, 401);
                }

                $response->throw();

                $json = $response->json();

                return is_array($json) ? $json : [];
            } catch (RuntimeException $exception) {
                throw $exception;
            } catch (RequestException $exception) {
                if ($this->isTokenFailure($exception->response)) {
                    throw new RuntimeException(self::TOKEN_EXPIRED, 401);
                }

                if ($this->isRateLimited($exception->response) && $attempt < $maxAttempts) {
                    $this->backoff($attempt, $exception->response);

                    continue;
                }

                Log::warning('meta.graph.request_failed', [
                    'status' => $exception->response?->status(),
                    'path' => $this->safeUrl($url),
                    'attempt' => $attempt,
                ]);

                throw $exception;
            } catch (Throwable $exception) {
                if ($attempt < $maxAttempts) {
                    $this->backoff($attempt, null);

                    continue;
                }

                Log::warning('meta.graph.request_failed', [
                    'path' => $this->safeUrl($url),
                    'attempt' => $attempt,
                    'error' => $exception->getMessage(),
                ]);

                throw $exception;
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function sendAbsolute(string $token, string $url): array
    {
        return $this->send($token, 'get', $url, []);
    }

    protected function client(string $token): PendingRequest
    {
        return Http::timeout(20)
            ->acceptJson()
            ->withToken($token)
            ->retry(0, 0);
    }

    protected function url(string $path): string
    {
        return 'https://graph.facebook.com/'.MetaAuth::graphVersion().'/'.ltrim($path, '/');
    }

    protected function isRateLimited(?Response $response): bool
    {
        if ($response === null) {
            return false;
        }

        if ($response->status() === 429) {
            return true;
        }

        $code = (int) ($response->json('error.code') ?? 0);

        return in_array($code, [4, 17, 32, 613, 80000, 80001, 80002, 80003, 80004], true);
    }

    protected function isTransient(?Response $response): bool
    {
        if ($response === null) {
            return false;
        }

        if (in_array($response->status(), [500, 502, 503, 504], true)) {
            return true;
        }

        $code = (int) ($response->json('error.code') ?? 0);

        return $code === 2;
    }

    protected function isTokenFailure(?Response $response): bool
    {
        if ($response === null) {
            return false;
        }

        $code = (int) ($response->json('error.code') ?? 0);
        $subcode = (int) ($response->json('error.error_subcode') ?? 0);

        return $response->status() === 401
            || in_array($code, [190, 102], true)
            || in_array($subcode, [458, 459, 460, 463, 464, 467], true);
    }

    protected function backoff(int $attempt, ?Response $response): void
    {
        $retryAfter = (int) ($response?->header('Retry-After') ?: 0);
        $seconds = $retryAfter > 0 ? min($retryAfter, 30) : min(2 ** $attempt, 16);

        if ($seconds > 0 && ! app()->environment('testing')) {
            usleep($seconds * 250_000);
        }
    }

    protected function safeUrl(string $url): string
    {
        $parts = parse_url($url);
        $path = $parts['path'] ?? '/';

        return ($parts['host'] ?? 'graph.facebook.com').$path;
    }
}
