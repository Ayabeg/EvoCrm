<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Support\GoogleAuth;
use App\Support\MetaAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → Apps: the integration marketplace. Real mini-apps only —
 * Meta (one OAuth), Google (sign-in), Email / SMTP (native mailboxes).
 * No fake tiles: an app appears here only when it has a real backend path.
 */
class AppsController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $meta = $workspace->integration(Integration::PROVIDER_META);
        $mailboxes = Mailbox::query()->forWorkspace($workspace)->count();

        return Inertia::render('settings/apps/index', [
            'apps' => [
                [
                    'key' => Integration::PROVIDER_META,
                    'name' => 'Meta',
                    'tagline' => 'One OAuth unlocks Facebook Page, Instagram, WhatsApp Cloud, and Ads.',
                    'connected' => $meta?->isConnected() ?? false,
                    'configured' => MetaAuth::enabled(),
                    'connected_at' => $meta?->connected_at?->toIso8601String(),
                    'connect_url' => '/settings/setup/meta',
                    'setup_url' => '/settings/setup/meta',
                    'manage_url' => '/settings/apps/meta',
                    'callback_url' => (string) config('services.meta.redirect'),
                    'unlocks' => MetaAuth::unlocks($meta),
                ],
                [
                    'key' => 'google',
                    'name' => 'Google',
                    'tagline' => 'Sign in with Google. Gmail and Calendar are official connectors on this same OAuth client.',
                    'connected' => GoogleAuth::enabled(),
                    'configured' => GoogleAuth::enabled(),
                    'connected_at' => null,
                    'connect_url' => null,
                    'manage_url' => '/settings/connectors',
                    'callback_url' => GoogleAuth::callbackUrl(),
                    'origin_url' => GoogleAuth::javascriptOrigin(),
                    'unlocks' => [],
                ],
                [
                    'key' => 'smtp',
                    'name' => 'Email / SMTP',
                    'tagline' => 'Official SMTP + IMAP mailboxes power the outbound department.',
                    'connected' => $mailboxes > 0,
                    'configured' => true,
                    'connected_at' => null,
                    'connect_url' => null,
                    'manage_url' => '/outbound/mailboxes',
                    'webmail_url' => config('services.webmail.url'),
                    'mailboxes' => $mailboxes,
                    'unlocks' => [],
                ],
            ],
        ]);
    }

    public function meta(Request $request): Response|RedirectResponse
    {
        $integration = $request->user()->workspace->integration(Integration::PROVIDER_META);

        if (! $integration?->isConnected()) {
            return redirect()->route('settings.apps');
        }

        return Inertia::render('settings/apps/meta', [
            'integration' => [
                'connected_at' => $integration->connected_at?->toIso8601String(),
                'expires_at' => $integration->expires_at?->toIso8601String(),
                'scopes' => $integration->scopes ?? [],
                'account_name' => $integration->meta['name'] ?? null,
                'account_email' => $integration->meta['email'] ?? null,
                'long_lived' => (bool) ($integration->meta['long_lived'] ?? false),
                'pages' => $integration->meta['pages'] ?? [],
                'ad_accounts' => $integration->meta['ad_accounts'] ?? [],
            ],
            'unlocks' => MetaAuth::unlocks($integration),
            'graph_version' => MetaAuth::graphVersion(),
        ]);
    }

    public function destroyMeta(Request $request): RedirectResponse
    {
        $integration = $request->user()->workspace->integration(Integration::PROVIDER_META);

        $integration?->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Meta disconnected. Stored tokens were deleted.',
        ]);

        return redirect()->route('settings.apps');
    }
}
