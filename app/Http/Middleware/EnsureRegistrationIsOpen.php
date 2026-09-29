<?php

namespace App\Http\Middleware;

use App\Support\SignupMode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRegistrationIsOpen
{
    public function handle(Request $request, Closure $next): Response
    {
        if (SignupMode::isInviteOnly() && $request->routeIs('register', 'register.store')) {
            abort(404);
        }

        return $next($request);
    }
}
