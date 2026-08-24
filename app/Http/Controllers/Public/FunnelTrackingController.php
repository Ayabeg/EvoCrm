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
                'utm_source' => $request->query('utm_source'),
                'utm_medium' => $request->query('utm_medium'),
                'utm_campaign' => $request->query('utm_campaign'),
                'source' => $request->query('src'),
                'meta' => [
                    'referrer' => $request->headers->get('referer'),
                    'path' => $request->query('path'),
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
}
