<?php

return [
    'scheduled_commands' => [
        'outbound:run' => [
            'label' => 'Outbound dispatcher',
            'cadence' => 'Every minute',
            'stale_after_seconds' => 180,
        ],
        'workflow:run' => [
            'label' => 'Workflow runner',
            'cadence' => 'Every minute',
            'stale_after_seconds' => 180,
        ],
        'outbound:poll-replies' => [
            'label' => 'IMAP reply polling',
            'cadence' => 'Every five minutes',
            'stale_after_seconds' => 900,
        ],
        'outbound:sync-mailboxes' => [
            'label' => 'Mailbox synchronization',
            'cadence' => 'Every fifteen minutes',
            'stale_after_seconds' => 1800,
        ],
        'reports:deliver' => [
            'label' => 'Scheduled report delivery',
            'cadence' => 'Daily at 08:00 Africa/Algiers',
            'stale_after_seconds' => 97200,
        ],
        'outbound:warmup' => [
            'label' => 'Mailbox warmup',
            'cadence' => 'Daily at 08:05 Africa/Algiers',
            'stale_after_seconds' => 97200,
        ],
    ],
];
