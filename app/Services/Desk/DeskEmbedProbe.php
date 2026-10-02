<?php

namespace App\Services\Desk;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Server-side check for whether the EvoDesk URL allows itself to be framed
 * by this CRM origin. Chatwoot's default X-Frame-Options: SAMEORIGIN blocks
 * the embed — in that case /inbox serves the native CRM desk with a banner
 * instead of a broken frame. Results are cached for 5 minutes.
 */
class DeskEmbedProbe
{
    public const int TTL_SECONDS = 300;

    /**
     * @return array{state: 'ok'|'blocked'|'unreachable', reason: string|null}
     */
    public function check(string $url, string $appUrl): array
    {
        $key = 'desk_embed_probe_'.md5($url.'|'.$appUrl);

        return Cache::remember($key, self::TTL_SECONDS, fn () => $this->probe($url, $appUrl));
    }

    /**
     * @return array{state: 'ok'|'blocked'|'unreachable', reason: string|null}
     */
    protected function probe(string $url, string $appUrl): array
    {
        try {
            $response = Http::timeout(6)
                ->withOptions(['allow_redirects' => true])
                ->get($url);
        } catch (\Throwable) {
            return [
                'state' => 'unreachable',
                'reason' => __('The desk URL could not be reached from this server. Showing the native CRM desk.'),
            ];
        }

        $xfo = strtolower((string) $response->header('X-Frame-Options'));

        if ($xfo !== '') {
            $sameHost = parse_url($url, PHP_URL_HOST) === parse_url($appUrl, PHP_URL_HOST);

            if (str_contains($xfo, 'deny') || (str_contains($xfo, 'sameorigin') && ! $sameHost)) {
                return [
                    'state' => 'blocked',
                    'reason' => __('EvoDesk sends X-Frame-Options: :header. Allow-frame this CRM origin on the desk (or clear the desk URL). Showing the native CRM desk.', [
                        'header' => $response->header('X-Frame-Options'),
                    ]),
                ];
            }
        }

        $csp = (string) $response->header('Content-Security-Policy');

        if ($csp !== '' && preg_match('/frame-ancestors\s+([^;]+)/i', $csp, $m)) {
            $ancestors = strtolower(trim($m[1]));
            $appHost = strtolower((string) parse_url($appUrl, PHP_URL_HOST));

            $allowed = str_contains($ancestors, '*')
                || ($appHost !== '' && str_contains($ancestors, $appHost));

            if (! $allowed || str_contains($ancestors, "'none'")) {
                return [
                    'state' => 'blocked',
                    'reason' => __('EvoDesk CSP frame-ancestors does not include this CRM origin. Allow-frame it on the desk. Showing the native CRM desk.'),
                ];
            }
        }

        return ['state' => 'ok', 'reason' => null];
    }
}
