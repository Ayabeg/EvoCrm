<?php

return [
    /*
    | Agent OS capability packs. Laravel owns this registry. OpenManus never
    | invents tools that are not in the workspace-allowed manifest.
    */
    'plugins' => [
        'crm.read' => [
            'name' => 'CRM read',
            'description' => 'Read-only search and get for contacts, companies, deals, leads, and quotes.',
            'permission' => 'read',
            'requires' => [],
        ],
        'crm.draft' => [
            'name' => 'CRM draft',
            'description' => 'Draft replies, notes, emails, and quote text. Nothing is sent.',
            'permission' => 'prepare',
            'requires' => [],
        ],
        'desk.inbox' => [
            'name' => 'Desk inbox',
            'description' => 'Read inbox threads and messages for the current workspace.',
            'permission' => 'read',
            'requires' => [],
        ],
        'browser.research' => [
            'name' => 'Browser research',
            'description' => 'Web research through the Browser Use MCP connector.',
            'permission' => 'read',
            'requires' => ['browser-use'],
        ],
    ],

    /*
    | Live tools the Python adapter may call back into Laravel.
    | Each tool belongs to one plugin (or a connector for MCP proxies).
    */
    'tools' => [
        'crm.search' => [
            'plugin' => 'crm.read',
            'name' => 'CRM search',
            'description' => 'Search contacts, companies, deals, leads, or quotes by text.',
        ],
        'crm.get' => [
            'plugin' => 'crm.read',
            'name' => 'CRM get',
            'description' => 'Fetch one CRM record by type and id.',
        ],
        'crm.draft_note' => [
            'plugin' => 'crm.draft',
            'name' => 'Draft note',
            'description' => 'Prepare a note. Never posts it.',
        ],
        'crm.draft_email' => [
            'plugin' => 'crm.draft',
            'name' => 'Draft email',
            'description' => 'Prepare an email. Never sends it.',
        ],
        'crm.draft_reply' => [
            'plugin' => 'crm.draft',
            'name' => 'Draft reply',
            'description' => 'Prepare an inbox reply. Never sends it.',
        ],
        'desk.list_threads' => [
            'plugin' => 'desk.inbox',
            'name' => 'List inbox threads',
            'description' => 'List recent Desk threads (read-only).',
        ],
        'desk.get_thread' => [
            'plugin' => 'desk.inbox',
            'name' => 'Get inbox thread',
            'description' => 'Read one Desk thread and its messages.',
        ],
        'browser.research' => [
            'plugin' => 'browser.research',
            'name' => 'Browser research',
            'description' => 'Research a query through the Browser Use MCP server.',
        ],
        'mcp.list_tools' => [
            'plugin' => null,
            'connector' => 'mcp.custom',
            'name' => 'List custom MCP tools',
            'description' => 'List tools advertised by the custom MCP server.',
        ],
        'mcp.call' => [
            'plugin' => null,
            'connector' => 'mcp.custom',
            'name' => 'Call custom MCP tool',
            'description' => 'Call one tool on the custom MCP server.',
        ],
    ],

    'connectors' => [
        'openmanus.runtime' => [
            'name' => 'Agent runtime',
            'description' => 'Private Python agent service. Keep it on a private network.',
            'wired' => true,
            'fields' => ['url', 'token'],
        ],
        'browser-use' => [
            'name' => 'Browser Use',
            'description' => 'MCP server for browser research. URL is the MCP HTTP endpoint; token is sent as Bearer.',
            'wired' => true,
            'fields' => ['url', 'token'],
        ],
        'webhook' => [
            'name' => 'Webhook',
            'description' => 'Optional outbound webhook for Agent run started/finished/failed events. No secrets are posted.',
            'wired' => true,
            'fields' => ['url', 'token'],
        ],
        'mcp.custom' => [
            'name' => 'Custom MCP',
            'description' => 'Custom MCP HTTP server. URL + optional Bearer. Tools are listed and called only while connected.',
            'wired' => true,
            'fields' => ['url', 'token'],
        ],
    ],
];
