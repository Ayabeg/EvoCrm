<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Evolution API — WhatsApp + WhatsApp Business
    |--------------------------------------------------------------------------
    |
    | Native Evolution instance types:
    |   WHATSAPP-BAILEYS   — phone WhatsApp (QR)
    |   WHATSAPP-BUSINESS  — official Cloud API (Facebook Login + Graph WABA)
    |
    | Platform keys stay on the server. Clients never type them.
    | OpenWA and linked-device takeovers stay refused.
    |
    */

    'base_url' => env('EVOLUTION_BASE_URL'),

    'api_key' => env('EVOLUTION_API_KEY'),

    'instance' => env('EVOLUTION_INSTANCE', 'evosales'),

    'webhook_url' => env('EVOLUTION_WEBHOOK_URL'),

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
