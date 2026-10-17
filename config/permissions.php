<?php

return [
    'capabilities' => [
        'crm.view' => [
            'label' => 'View CRM records',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => true],
        ],
        'crm.edit' => [
            'label' => 'Create and edit CRM records',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'crm.export' => [
            'label' => 'Export CRM data',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'crm.import' => [
            'label' => 'Import CRM data',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'crm.merge' => [
            'label' => 'Merge CRM records',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'crm.bulk' => [
            'label' => 'Run bulk CRM actions',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'desk.manage' => [
            'label' => 'Reply and manage Desk connectors',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'reports.manage' => [
            'label' => 'Create reports and dashboards',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => true],
        ],
        'automation.manage' => [
            'label' => 'Manage workflows',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'ads.manage' => [
            'label' => 'Synchronize Ads and audiences',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'outbound.manage' => [
            'label' => 'Manage outbound operations',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.integrations' => [
            'label' => 'Manage integrations',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.people' => [
            'label' => 'Manage workspace people',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.pipelines' => [
            'label' => 'Manage pipelines',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.support' => [
            'label' => 'Manage support queues',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.attributes' => [
            'label' => 'Manage custom attributes and layouts',
            'defaults' => ['owner' => true, 'admin' => true, 'member' => false],
        ],
        'settings.permissions' => [
            'label' => 'Grant member permissions',
            'defaults' => ['owner' => true, 'admin' => false, 'member' => false],
        ],
    ],
];
