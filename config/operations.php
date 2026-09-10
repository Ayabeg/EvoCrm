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
        'google:sync-mail' => [
            'label' => 'Gmail timeline sync',
            'cadence' => 'Every fifteen minutes',
            'stale_after_seconds' => 1800,
        ],
        'google:sync-calendar' => [
            'label' => 'Google Calendar sync',
            'cadence' => 'Every fifteen minutes',
            'stale_after_seconds' => 1800,
        ],
        'lead-os:graph' => [
            'label' => 'Lead OS nightly graph',
            'cadence' => 'Daily at 02:15 Africa/Algiers',
            'stale_after_seconds' => 97200,
        ],
        'deals:lost-review' => [
            'label' => 'Weekly lost deal review',
            'cadence' => 'Mondays at 07:30 Africa/Algiers',
            'stale_after_seconds' => 700000,
        ],
        'meetings:nudge' => [
            'label' => 'Meeting reminders and no-shows',
            'cadence' => 'Every minute',
            'stale_after_seconds' => 180,
        ],
    ],
];
