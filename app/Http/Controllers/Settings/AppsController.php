<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Services\Evolution\WhatsAppConnector;
use App\Services\Operations\AuditLogger;
use App\Support\GoogleAuth;
use App\Support\InstagramAuth;
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
    public function index(Request $request, WhatsAppConnector $whatsapp): Response
    {
        $workspace = $request->user()->workspace;
        $meta = $workspace->integration(Integration::PROVIDER_META);
        $instagram = $workspace->integration(Integration::PROVIDER_INSTAGRAM);
        $mailboxes = Mailbox::query()->forWorkspace($workspace)->count();
        $phone = $whatsapp->phoneStatus($workspace);
        $business = $whatsapp->provisionBusinessIfReady($workspace);
        $phoneIntegration = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $businessIntegration = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);
        $phoneConnected = ($phoneIntegration?->isConnected() ?? false) || (bool) ($phone['connected'] ?? false);
        $businessConnected = ($businessIntegration?->isConnected() ?? false) || (bool) ($business['connected'] ?? false);
        $metaConnected = ($meta?->isConnected() ?? false) || ($instagram?->isConnected() ?? false);
        $gmail = $workspace->integration(Integration::PROVIDER_GMAIL);
        $calendar = $workspace->integration(Integration::PROVIDER_GOOGLE_CALENDAR);
        $googleWorkspaceConnected = ($gmail?->isConnected() ?? false) || ($calendar?->isConnected() ?? false);
        $canConfigure = $request->user()->canPermission('settings.integrations');

        return Inertia::render('settings/apps/index', [
            'can_configure' => $canConfigure,
            'apps' => [
                [
                    'key' => Integration::PROVIDER_META,
                    'name' => 'Meta',
                    'tagline' => 'Log in with Facebook to connect Pages, Instagram, WhatsApp, and Ads.',
                    'connected' => $metaConnected,
                    'status' => $metaConnected ? 'connected' : 'not_connected',
                    'configured' => MetaAuth::enabled(),
                    'account_label' => $meta?->meta['name'] ?? $meta?->meta['email'] ?? null,
                    'connected_at' => $meta?->connected_at?->toIso8601String()
                        ?? $instagram?->connected_at?->toIso8601String(),
                    'connect_url' => '/auth/meta?popup=1',
                    'setup_url' => '/settings/setup/meta',
                    'manage_url' => '/settings/apps/meta',
                    'popup' => true,
                    'instagram_connected' => $instagram?->isConnected() ?? false,
                    'facebook_connected' => $meta?->isConnected() ?? false,
                    'unlocks' => array_merge(
                        MetaAuth::unlocks($meta),
                        InstagramAuth::unlocks($instagram),
                    ),
                ],
                [
                    'key' => Integration::PROVIDER_WHATSAPP,
                    'name' => 'WhatsApp',
                    'tagline' => 'Personal WhatsApp via Evolution (Baileys). Separate from WhatsApp Business Cloud.',
                    'connected' => $phoneConnected,
                    'status' => $phoneConnected ? 'connected' : 'not_connected',
                    'configured' => MetaAuth::enabled(),
                    'account_label' => $phone['display_phone'] ?? $phoneIntegration?->meta['display_phone'] ?? null,
                    'connected_at' => $phoneIntegration?->connected_at?->toIso8601String(),
                    'connect_url' => '/auth/meta?popup=1',
                    'manage_url' => '/settings/whatsapp',
                    'popup' => true,
                    'unlocks' => [],
                    'setup_url' => '/settings/setup/start?step=whatsapp',
                ],
                [
                    'key' => Integration::PROVIDER_WHATSAPP_BUSINESS,
                    'name' => 'WhatsApp Business',
                    'tagline' => 'WhatsApp Cloud via Evolution. Requires Facebook login — no phone-number ID to type.',
                    'connected' => $businessConnected,
                    'status' => $businessConnected ? 'connected' : 'not_connected',
                    'configured' => MetaAuth::enabled(),
                    'account_label' => $business['display_phone'] ?? $business['verified_name'] ?? $businessIntegration?->meta['display_phone'] ?? null,
                    'connected_at' => $businessIntegration?->connected_at?->toIso8601String(),
                    'connect_url' => '/auth/meta?popup=1',
                    'manage_url' => '/settings/whatsapp-business',
                    'popup' => true,
                    'unlocks' => [],
                ],
                [
                    'key' => 'google',
                    'name' => 'Google',
                    'tagline' => 'Gmail and Calendar connectors on the existing Google OAuth client.',
                    'connected' => $googleWorkspaceConnected,
                    'status' => $googleWorkspaceConnected ? 'connected' : 'not_connected',
                    'configured' => GoogleAuth::enabled(),
                    'account_label' => $gmail?->meta['google_email'] ?? $calendar?->meta['google_email'] ?? null,
                    'connected_at' => $gmail?->connected_at?->toIso8601String()
                        ?? $calendar?->connected_at?->toIso8601String(),
                    'connect_url' => null,
                    'manage_url' => '/settings/connectors',
                    'setup_url' => '/settings/setup/start?step=google',
                    'callback_url' => GoogleAuth::callbackUrl(),
                    'origin_url' => GoogleAuth::javascriptOrigin(),
                    'unlocks' => [],
                ],
                [
                    'key' => 'smtp',
                    'name' => 'Email / SMTP',
                    'tagline' => 'Official SMTP + IMAP mailboxes power the outbound department.',
                    'connected' => $mailboxes > 0,
                    'status' => $mailboxes > 0 ? 'connected' : 'not_connected',
                    'configured' => true,
                    'account_label' => $mailboxes > 0 ? $mailboxes.' mailbox'.($mailboxes === 1 ? '' : 'es') : null,
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
        $workspace = $request->user()->workspace;
        $integration = $workspace->integration(Integration::PROVIDER_META);
        $instagram = $workspace->integration(Integration::PROVIDER_INSTAGRAM);

        if (! $integration?->isConnected() && ! $instagram?->isConnected()) {
            return redirect()->route('settings.apps');
        }

        return Inertia::render('settings/apps/meta', [
            'integration' => [
                'connected_at' => $integration?->connected_at?->toIso8601String()
                    ?? $instagram?->connected_at?->toIso8601String(),
                'expires_at' => $integration?->expires_at?->toIso8601String(),
                'scopes' => array_values(array_unique(array_merge(
                    $integration?->scopes ?? [],
                    $instagram?->scopes ?? [],
                ))),
                'account_name' => $integration?->meta['name'] ?? null,
                'account_email' => $integration?->meta['email'] ?? null,
                'long_lived' => (bool) ($integration?->meta['long_lived'] ?? $instagram?->meta['long_lived'] ?? false),
                'pages' => $this->publicAssets($integration?->meta['pages'] ?? []),
                'instagram_accounts' => $this->publicAssets($integration?->meta['instagram_accounts'] ?? []),
                'ad_accounts' => $this->publicAssets($integration?->meta['ad_accounts'] ?? []),
            ],
            'instagram_connected' => $instagram?->isConnected() ?? false,
            'unlocks' => array_merge(
                MetaAuth::unlocks($integration),
                InstagramAuth::unlocks($instagram),
            ),
            'graph_version' => MetaAuth::graphVersion(),
        ]);
    }

    public function destroyMeta(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role->canManageSettings(), 403);

        $workspace = $request->user()->workspace;
        $workspace->integration(Integration::PROVIDER_META)?->delete();
        $workspace->integration(Integration::PROVIDER_INSTAGRAM)?->delete();

        app(AuditLogger::class)->record(
            $workspace,
            'meta.disconnected',
            'Meta disconnected for this workspace',
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Meta disconnected. Stored tokens were deleted.',
        ]);

        return redirect()->route('settings.apps');
    }

    /**
     * @return list<array{id: string, name: string}>
     */
    private function publicAssets(mixed $assets): array
    {
        if (! is_array($assets)) {
            return [];
        }

        $public = [];

        foreach ($assets as $asset) {
            if (! is_array($asset) || ! filled($asset['id'] ?? null)) {
                continue;
            }

            $public[] = [
                'id' => (string) $asset['id'],
                'name' => (string) ($asset['name'] ?? $asset['id']),
            ];
        }

        return $public;
    }
}
