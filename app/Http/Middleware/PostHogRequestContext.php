<?php

namespace App\Http\Middleware;

use App\Services\Analytics\ProductAnalytics;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class PostHogRequestContext
{
    public function handle(Request $request, Closure $next): Response
    {
        app(ProductAnalytics::class)->setRequestContext(
            $request->header('X-POSTHOG-DISTINCT-ID'),
            $request->header('X-POSTHOG-SESSION-ID'),
        );

        return $next($request);
    }
}
