<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $incoming = trim((string) $request->header('X-Request-Id', ''));
        $requestId = preg_match('/^[A-Za-z0-9._-]{1,80}$/', $incoming) === 1
            ? $incoming
            : (string) Str::ulid();

        $request->attributes->set('request_id', $requestId);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        return $response;
    }
}
