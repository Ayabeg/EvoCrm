<?php

use App\Exceptions\UnofficialWhatsAppRefused;
use App\Http\Middleware\AuthenticateAgentRuntime;
use App\Http\Middleware\EmbedSecurityHeaders;
use App\Http\Middleware\EnsureApiWorkspaceToken;
use App\Http\Middleware\EnsureRegistrationIsOpen;
use App\Http\Middleware\EnsureUserCanManageSettings;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PostHogRequestContext;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\SecurityHeaders;
use App\Services\Analytics\ProductAnalytics;
use App\Support\TrustedProxies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: TrustedProxies::at());

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'locale']);

        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
            'api/agent/tools',
            'api/agent/tools/*',
            'auth/apple/callback',
        ]);

        $middleware->web(append: [
            EnsureRegistrationIsOpen::class,
            SetLocale::class,
            SecurityHeaders::class,
            EmbedSecurityHeaders::class,
            PostHogRequestContext::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'can-manage-settings' => EnsureUserCanManageSettings::class,
            'api-workspace' => EnsureApiWorkspaceToken::class,
            'agent-runtime' => AuthenticateAgentRuntime::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->report(function (Throwable $e): void {
            app(ProductAnalytics::class)->captureException($e);
        });

        $exceptions->render(function (UnofficialWhatsAppRefused $e) {
            return response($e->getMessage(), 422);
        });
    })->create();
