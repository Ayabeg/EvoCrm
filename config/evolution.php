<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Evolution API — WhatsApp Cloud only
    |--------------------------------------------------------------------------
    |
    | EvoSales talks to Evolution API exclusively in Cloud / Business API
    | mode (integration = WHATSAPP-BUSINESS). Baileys, QR login, Linked
    | devices, OpenWA, and any consumer-WhatsApp takeover are refused.
    |
    */

    'base_url' => env('EVOLUTION_BASE_URL'),

    'api_key' => env('EVOLUTION_API_KEY'),

    'instance' => env('EVOLUTION_INSTANCE', 'evosales'),

    'webhook_url' => env('EVOLUTION_WEBHOOK_URL'),

    /*
    | Hard-coded product constraint. Never change this to WHATSAPP-BAILEYS.
    */
    'integration' => 'WHATSAPP-BUSINESS',

    'qrcode' => false,

    'timeout' => (int) env('EVOLUTION_TIMEOUT', 15),

    'meta' => [
        'token' => env('WA_BUSINESS_TOKEN'),
        'phone_number_id' => env('WA_BUSINESS_PHONE_NUMBER_ID'),
        'waba_id' => env('WA_BUSINESS_WABA_ID'),
        'graph_version' => env('WA_BUSINESS_GRAPH_VERSION', 'v21.0'),
        'graph_url' => env('WA_BUSINESS_URL', 'https://graph.facebook.com'),
        'webhook_verify_token' => env('WA_BUSINESS_TOKEN_WEBHOOK'),
        'language' => env('WA_BUSINESS_LANGUAGE', 'fr'),
    ],

    /*
    | Optional sibling desk (Chatwoot Community). Documented integration
    | target only — this repo is the product control plane.
    */
    'evodesk_url' => env('EVODESK_URL'),

];
