<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Settings that manage people are owner/admin territory. Members get a
 * hard 403 — the nav item is hidden for them, but the URL is guarded too.
 */
class EnsureUserCanManageSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->role->canManageSettings(), 403);

        return $next($request);
    }
}
