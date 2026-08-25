<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Meta (Facebook Login + Marketing/Graph) — official OAuth only
    |--------------------------------------------------------------------------
    |
    | One OAuth on the workspace unlocks Facebook Page, Instagram, WhatsApp
    | Cloud, and Ads. Empty credentials render a clear "not connected" state
    | on Settings → Apps and the /auth/meta routes 404 — never a 500.
    |
    | Callback (Meta App Dashboard → Facebook Login → Valid OAuth Redirect
    | URI): https://crm.evotechly.com/auth/meta/callback
    |
    | Live Ads / WhatsApp messaging still require Meta Business Verification
    | and App Review advanced access for the scopes below.
    |
    */

    'app_id' => env('META_APP_ID'),

    'app_secret' => env('META_APP_SECRET'),

    'redirect_uri' => env('META_REDIRECT_URI', 'https://crm.evotechly.com/auth/meta/callback'),

    'graph_version' => env('META_GRAPH_VERSION', 'v21.0'),

    'scopes' => [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_manage_messages',
        'whatsapp_business_management',
        'whatsapp_business_messaging',
        'ads_management',
        'business_management',
    ],

];
