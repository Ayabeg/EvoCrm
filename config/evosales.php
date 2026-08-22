<?php

return [

    'company' => env('EVOSALES_COMPANY', 'Evotechly'),

    'timezone' => env('APP_TIMEZONE', 'Africa/Algiers'),

    'default_country_code' => '213',

    'quiet_hours' => [
        'timezone' => 'Africa/Algiers',
        'starts_at' => env('EVOSALES_QUIET_START', '21:00'),
        'ends_at' => env('EVOSALES_QUIET_END', '08:00'),
    ],

    'roles' => ['owner', 'admin', 'member'],

    'pipeline' => [
        ['name' => 'New', 'slug' => 'new', 'position' => 1, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Qualified', 'slug' => 'qualified', 'position' => 2, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Demo', 'slug' => 'demo', 'position' => 3, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Proposal', 'slug' => 'proposal', 'position' => 4, 'is_won' => false, 'is_lost' => false],
        ['name' => 'Won', 'slug' => 'won', 'position' => 5, 'is_won' => true, 'is_lost' => false],
        ['name' => 'Lost', 'slug' => 'lost', 'position' => 6, 'is_won' => false, 'is_lost' => true],
    ],

];
