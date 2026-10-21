<?php

return [

    'company' => env('EVOSALES_COMPANY', 'Evotechly'),

    'brand_title' => env('APP_NAME', 'EvoCrm · Evotechly'),

    /*
    | Public self-serve signup. Default is invite-only for the pilot:
    | /register is closed, OAuth cannot create a workspace, and the login
    | screen shows a request-access link. Invited users still set a password
    | through Fortify's reset flow. Set EVOCRM_SIGNUP_MODE=open to reopen.
    */
    'signup' => [
        'mode' => env('EVOCRM_SIGNUP_MODE', 'invite'),
        'request_url' => env('EVOCRM_SIGNUP_REQUEST_URL', 'mailto:hello@evotechly.com'),
    ],

    /*
    | Sold Desk is EvoDesk (Chatwoot Community MIT), not a Laravel inbox clone.
    | Default: https://desk.evotechly.com
    |
    | The desk is embedded inside the CRM at /inbox (iframe src = inbox_url +
    | inbox_embed_path). Operators stay on the CRM hostname. If the desk
    | deployment sends X-Frame-Options: DENY, either allow-frame the CRM
    | origin on the desk, or leave inbox_url empty to serve the native
    | CRM conversation desk at /inbox instead.
    */
    'inbox_url' => env('EVOSALES_INBOX_URL', env('EVODESK_URL', 'https://desk.evotechly.com')),

    /*
    | Path appended to inbox_url for the embedded desk frame. Chatwoot serves
    | the agent app under /app — set EVOSALES_INBOX_EMBED_PATH=/app if your
    | EvoDesk does not redirect there itself.
    */
    'inbox_embed_path' => env('EVOSALES_INBOX_EMBED_PATH', '/'),

    /*
    | Framing policy Laravel can set on CRM responses. frame-ancestors is the
    | CRM-host allowlist; frame-src is the desk iframe allowlist. The desk
    | vhost on Contabo must send the same ancestors — Laravel cannot. See
    | docs/desk-iframe-headers.md. Extra origins are comma-separated.
    */
    'embed' => [
        'frame_ancestors' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('EVOSALES_FRAME_ANCESTORS', '')),
        ))),
        'frame_src' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('EVOSALES_FRAME_SRC', '')),
        ))),
    ],

    /*
    | Live mail stack (EvoOutreach) at outbound.evotechly.com. The CRM uses
    | it for three things only: SMTP send, IMAP reply polling, and Roundcube
    | webmail. Mailbox records sync from its HTTP API when api_token is set
    | (outbound:sync-mailboxes, every 15 minutes). The stack's own marketing
    | dashboard is never linked or embedded — campaigns live in the CRM.
    */
    'mail_stack' => [
        'api_url' => env('EVOSALES_MAIL_API_URL', 'https://outbound.evotechly.com'),
        'api_token' => env('EVOSALES_MAIL_API_TOKEN'),
        'smtp' => [
            'host' => env('EVOSALES_SMTP_HOST', 'outbound.evotechly.com'),
            'port' => (int) env('EVOSALES_SMTP_PORT', 587),
            'encryption' => env('EVOSALES_SMTP_ENCRYPTION', 'tls'),
        ],
        'imap' => [
            'host' => env('EVOSALES_IMAP_HOST', 'outbound.evotechly.com'),
            'port' => (int) env('EVOSALES_IMAP_PORT', 993),
            'encryption' => env('EVOSALES_IMAP_ENCRYPTION', 'ssl'),
        ],
        'roundcube_url' => env('EVOSALES_ROUNDCUBE_URL', 'https://outbound.evotechly.com/roundcube/'),
    ],

    'timezone' => env('APP_TIMEZONE', 'Africa/Algiers'),

    'default_country_code' => '213',

    'quiet_hours' => [
        'timezone' => 'Africa/Algiers',
        'starts_at' => env('EVOSALES_QUIET_START', '21:00'),
        'ends_at' => env('EVOSALES_QUIET_END', '08:00'),
    ],

    'outbound' => [
        'block_catch_all' => env('EVOSALES_BLOCK_CATCH_ALL_EMAIL', true),
        'block_unknown_verification' => env('EVOSALES_BLOCK_UNKNOWN_EMAIL', false),
    ],

    'roles' => ['owner', 'admin', 'member'],

    'cities' => [
        'Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Tlemcen',
        'Blida', 'Béjaïa', 'Batna', 'Tizi Ouzou', 'Ouargla', 'Mostaganem',
    ],

    'wilayas' => [
        'Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Tlemcen',
        'Blida', 'Béjaïa', 'Batna', 'Tizi Ouzou', 'Ouargla', 'Mostaganem',
    ],

    'activity_types' => ['note', 'task', 'call', 'meeting', 'email', 'whatsapp', 'stage_change', 'sequence'],

    'workflow_triggers' => ['contact.created', 'deal.stage_changed'],

    'workflow_actions' => ['create_task', 'enroll_sequence'],

    'quote_statuses' => ['draft', 'sent', 'accepted'],

    /*
    | Local product catalog (stand-in until Evostock sync). Prices are DZD.
    | SKU is the join key Evostock can match later. unit_cents = DZD × 100.
    */
    'catalog' => [
        ['sku' => 'EVO-SALES-WS', 'name' => 'EvoSales workspace', 'unit_dzd' => 180000],
        ['sku' => 'EVO-DESK-SEAT', 'name' => 'EvoDesk agent seat', 'unit_dzd' => 45000],
        ['sku' => 'EVO-ONBOARD', 'name' => 'Onboarding', 'unit_dzd' => 40000],
        ['sku' => 'EVO-WA-CLOUD', 'name' => 'WhatsApp Cloud connect', 'unit_dzd' => 25000],
        ['sku' => 'EVO-OUTBOUND', 'name' => 'Outbound sequences pack', 'unit_dzd' => 60000],
    ],

    'attribute_types' => ['text', 'number', 'list'],

    /*
    | Default Sales pipeline. Stage names stay Evotechly (New → Lost), not
    | HubSpot Appointment Scheduled. Win probability (0–100) is used by the
    | deals board forecast: weighted_cents = amount_cents * probability / 100.
    | A stage row may store its own `probability`; if that column is null,
    | these defaults apply. Unknown open stages fall back to 20.
    |
    | Defaults: New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0.
    */
    'pipeline' => [
        ['name' => 'New', 'slug' => 'new', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'probability' => 10],
        ['name' => 'Qualified', 'slug' => 'qualified', 'position' => 2, 'is_won' => false, 'is_lost' => false, 'probability' => 25],
        ['name' => 'Demo', 'slug' => 'demo', 'position' => 3, 'is_won' => false, 'is_lost' => false, 'probability' => 50],
        ['name' => 'Proposal', 'slug' => 'proposal', 'position' => 4, 'is_won' => false, 'is_lost' => false, 'probability' => 75],
        ['name' => 'Won', 'slug' => 'won', 'position' => 5, 'is_won' => true, 'is_lost' => false, 'probability' => 100],
        ['name' => 'Lost', 'slug' => 'lost', 'position' => 6, 'is_won' => false, 'is_lost' => true, 'probability' => 0],
    ],

    'stage_probability_fallback' => 20,

    /*
    | Formula lead score thresholds (0–100). Crossing qualify marks the Lead
    | qualified. Crossing convert uses LeadConverter — never a second path.
    | Hold moves new → working. Workspaces may override via lead_score_settings.
    */
    'lead_score' => [
        'hold' => 40,
        'qualify' => 60,
        'convert' => 80,
    ],

    /*
    | Default deep conversion funnel (Visits → Orders → Confirmed → Delivered).
    | matcher_type is resolved by ConversionFunnelQuery; FunnelEventRecorder
    | writes event_type rows for the bottom three stages plus visits.
    */
    'conversion_funnel' => [
        'stages' => [
            [
                'key' => 'visits',
                'label' => 'Visits',
                'position' => 1,
                'matcher_type' => 'event',
                'matcher_config' => ['event_type' => 'visit'],
            ],
            [
                'key' => 'orders_placed',
                'label' => 'Orders placed',
                'position' => 2,
                'matcher_type' => 'event',
                'matcher_config' => ['event_type' => 'order_placed'],
            ],
            [
                'key' => 'confirmed',
                'label' => 'Confirmed',
                'position' => 3,
                'matcher_type' => 'event',
                'matcher_config' => ['event_type' => 'confirmed'],
            ],
            [
                'key' => 'delivered',
                'label' => 'Delivered',
                'position' => 4,
                'matcher_type' => 'event',
                'matcher_config' => ['event_type' => 'delivered'],
            ],
        ],
    ],

];
