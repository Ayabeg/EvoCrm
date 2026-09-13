<?php

namespace App\Http\Middleware;

use App\Support\SimpleMode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceSimpleMode
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if(SimpleMode::blocks($request), 403);

        return $next($request);
    }
}
