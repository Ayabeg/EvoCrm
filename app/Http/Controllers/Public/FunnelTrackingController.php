<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Funnels\FunnelEventRecorder;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;

class FunnelTrackingController extends Controller
{
    /**
     * 1px visit beacon for landing pages. Public by workspace slug; records
     * a funnel visit with optional UTM parameters from the query string.
     */
    public function pixel(string $slug, Request $request, FunnelEventRecorder $recorder): HttpResponse
    {
        $workspace = Workspace::query()->where('slug', $slug)->first();

        if ($workspace) {
            $recorder->recordVisit($workspace, [
                'utm_source' => $this->boundedValue($request->query('utm_source')),
                'utm_medium' => $this->boundedValue($request->query('utm_medium')),
                'utm_campaign' => $this->boundedValue($request->query('utm_campaign')),
                'source' => $this->boundedValue($request->query('src')),
                'meta' => [
                    'referrer' => $this->safeReferrer($request->headers->get('referer')),
                    'path' => $this->safePath($request->query('path')),
                ],
            ]);
        }

        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return new HttpResponse($gif, 200, [
            'Content-Type' => 'image/gif',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    private function boundedValue(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== ''
            ? mb_substr(trim($value), 0, 100)
            : null;
    }

    private function safeReferrer(?string $referrer): ?string
    {
        $parts = is_string($referrer) ? parse_url($referrer) : false;

        if (! is_array($parts) || ! in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true)) {
            return null;
        }

        $host = strtolower((string) ($parts['host'] ?? ''));

        if ($host === '') {
            return null;
        }

        return mb_substr(sprintf(
            '%s://%s%s',
            strtolower((string) $parts['scheme']),
            $host,
            (string) ($parts['path'] ?? ''),
        ), 0, 500);
    }

    private function safePath(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $path = parse_url(trim($value), PHP_URL_PATH);

        if (! is_string($path) || ! str_starts_with($path, '/')) {
            return null;
        }

        return mb_substr($path, 0, 200);
    }
}
