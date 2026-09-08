<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Google sign-in (Laravel Socialite). Leave the client credentials empty
    | to hide the "Continue with Google" button and disable the routes.
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        // Empty string in .env must not win over the default — Google rejects
        // a blank redirect_uri as Error 400 redirect_uri_mismatch.
        'redirect' => env('GOOGLE_REDIRECT_URI') ?: 'https://crm.evotechly.com/auth/google/callback',
        /*
        | Extra scopes on the SAME OAuth client as sign-in. Login never
        | requests these — only Settings → Connectors → Reconnect does.
        */
        'gmail_scope' => env('GOOGLE_GMAIL_SCOPE'),
        'calendar_scope' => env('GOOGLE_CALENDAR_SCOPE'),
        /*
        | Places API (New) server key for first-party company lookup.
        | Empty = Google Places enricher no-ops and records a skip.
        | Official Text Search only: https://places.googleapis.com/v1/places:searchText
        */
        'places_key' => env('GOOGLE_PLACES_API_KEY'),
    ],

    /*
    | Meta workspace connection (Facebook Login via Socialite's Facebook
    | provider, registered as the "meta" driver). Leave empty to disable
    | Connect on Settings → Apps without breaking the marketplace page.
    */
    'meta' => [
        'client_id' => env('META_APP_ID'),
        'client_secret' => env('META_APP_SECRET'),
        'redirect' => env('META_REDIRECT_URI'),
    ],

    /*
    | Optional webmail (e.g. Roundcube) URL surfaced on the Email / SMTP app
    | card. Empty hides the link — mailboxes are managed natively at
    | /outbound/mailboxes either way.
    */
    'webmail' => [
        'url' => env('WEBMAIL_URL'),
    ],

    /*
    | Optional Ask Evo live completion. Empty keys keep RecordInsight on the
    | deterministic field stub so tests and local setups never need a vendor.
    */
    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'timeout' => 8,
    ],

    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-3-5-haiku-latest'),
        'timeout' => 8,
    ],

    /*
    | PostHog product analytics + data hub. The project token is safe to
    | expose to the browser. Leave empty to disable capture in local/CI.
    */
    'posthog' => [
        'api_key' => env('POSTHOG_API_KEY', env('VITE_POSTHOG_KEY')),
        'host' => env('POSTHOG_HOST', env('VITE_POSTHOG_HOST', 'https://us.i.posthog.com')),
    ],

];
