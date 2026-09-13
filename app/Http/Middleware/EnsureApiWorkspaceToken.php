<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiWorkspaceToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user?->workspace_id, 403, 'User is not assigned to a workspace.');
        abort_unless($user->tokenCan($user->workspaceAbility()), 403, 'Token is not valid for this workspace.');

        return $next($request);
    }
}
