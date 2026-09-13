<?php

namespace App\Http\Middleware;

use App\Support\EmbedCsp;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Stay-on-host desk embed: Laravel sets frame-ancestors for the CRM hosts
 * and frame-src for EvoDesk. X-Frame-Options DENY/SAMEORIGIN is stripped so
 * CSP is the only framing signal (Chatwoot-style XFO would eject the iframe).
 */
final class EmbedSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Content-Security-Policy', EmbedCsp::header($request));
        $response->headers->remove('X-Frame-Options');

        return $response;
    }
}
