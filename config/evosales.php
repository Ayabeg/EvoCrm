<?php

return [

    'company' => env('EVOSALES_COMPANY', 'Evotechly'),

    'brand_title' => env('APP_NAME', 'EvoSales · Evotechly'),

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

    'timezone' => env('APP_TIMEZONE', 'Africa/Algiers'),

    'default_country_code' => '213',

    'quiet_hours' => [
        'timezone' => 'Africa/Algiers',
        'starts_at' => env('EVOSALES_QUIET_START', '21:00'),
        'ends_at' => env('EVOSALES_QUIET_END', '08:00'),
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

    'activity_types' => ['note', 'task', 'call', 'meeting', 'email', 'stage_change', 'sequence'],

    'workflow_triggers' => ['contact.created', 'deal.stage_changed'],

    'workflow_actions' => ['create_task', 'enroll_sequence'],

    'quote_statuses' => ['draft', 'sent', 'accepted'],

    'attribute_types' => ['text', 'number', 'list'],

    'pipeline' => [
        ['name' => 'New', 'slug' => 'new', 'position' => 1, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Qualified', 'slug' => 'qualified', 'position' => 2, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Demo', 'slug' => 'demo', 'position' => 3, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Proposal', 'slug' => 'proposal', 'position' => 4, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Won', 'slug' => 'won', 'position' => 5, 'is_won' => true, 'is_lost' => false],
        ['name' => 'Lost', 'slug' => 'lost', 'position' => 6, 'is_won' => false, 'is_lost' => true],
    ],

];
