<?php

namespace App\Support;

use App\Models\Integration;

class MetaAuth
{
    /**
     * Meta OAuth (Facebook Login) is available only when the app credentials
     * are configured; otherwise the Connect button stays disabled and the
     * /auth/meta routes 404 — never a 500.
     */
    public static function enabled(): bool
    {
        return filled(config('meta.app_id'))
            && filled(config('meta.app_secret'));
    }

    /**
     * One OAuth unlocks Facebook Page, Instagram, WhatsApp Cloud, and Ads.
     *
     * @return array<int, string>
     */
    public static function scopes(): array
    {
        return config('meta.scopes', []);
    }

    public static function graphVersion(): string
    {
        return (string) config('meta.graph_version', 'v21.0');
    }

    /**
     * What the one Meta OAuth unlocks, with the granted state of each scope
     * on the given connection (null connection = nothing granted yet).
     *
     * @return array<int, array{key: string, label: string, scope: string, granted: bool}>
     */
    public static function unlocks(?Integration $integration): array
    {
        $granted = fn (array $scopes): bool => $integration !== null
            && count(array_intersect($scopes, $integration->scopes ?? [])) > 0;

        return [
            [
                'key' => 'facebook_page',
                'label' => 'Facebook Page',
                'scope' => 'pages_show_list',
                'granted' => $granted(['pages_show_list']),
            ],
            [
                'key' => 'instagram',
                'label' => 'Instagram',
                'scope' => 'instagram_basic',
                'granted' => $granted(['instagram_basic']),
            ],
            [
                'key' => 'whatsapp_cloud',
                'label' => 'WhatsApp Cloud',
                'scope' => 'whatsapp_business_messaging',
                'granted' => $granted(['whatsapp_business_messaging', 'whatsapp_business_management']),
            ],
            [
                'key' => 'ads',
                'label' => 'Ads',
                'scope' => 'ads_management',
                'granted' => $granted(['ads_management', 'ads_read']),
            ],
            [
                'key' => 'lead_ads',
                'label' => 'Lead Ads',
                'scope' => 'leads_retrieval',
                'granted' => $granted(['leads_retrieval']),
            ],
        ];
    }
}
