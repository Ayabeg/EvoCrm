export type SettingsScope =
    | 'ME'
    | 'WORKSPACE'
    | 'CRM'
    | 'CHANNEL'
    | 'INTEGRATION'
    | 'DEVELOPER';

export type SettingsGroupId =
    | 'Personal'
    | 'Workspace'
    | 'CRM'
    | 'Communication'
    | 'Integrations'
    | 'Developer';

export type SettingsDestination = {
    title: string;
    href: string;
    group: SettingsGroupId;
    scope: SettingsScope;
    keywords: string[];
    permission?: string;
    adminOnly?: boolean;
    ownerOnly?: boolean;
    requiresSmsFeature?: boolean;
};

export type SettingsNavGroup = {
    title: SettingsGroupId;
    scope: SettingsScope;
    items: SettingsDestination[];
};

export const SETTINGS_GROUP_ORDER: SettingsGroupId[] = [
    'Personal',
    'Workspace',
    'CRM',
    'Communication',
    'Integrations',
    'Developer',
];

export const SETTINGS_SCOPE_BY_GROUP: Record<SettingsGroupId, SettingsScope> = {
    Personal: 'ME',
    Workspace: 'WORKSPACE',
    CRM: 'CRM',
    Communication: 'CHANNEL',
    Integrations: 'INTEGRATION',
    Developer: 'DEVELOPER',
};

export const SETTINGS_PROFILE_HREF = '/settings/profile';

/**
 * Known settings destinations only. Every href is a live route.
 * Omitted on purpose (no empty taxonomy / no fake capability):
 * Teams, Email, Billing, API, Webhooks, Automation / workflow editor.
 */
export const SETTINGS_DESTINATIONS: SettingsDestination[] = [
    {
        title: 'Profile',
        href: SETTINGS_PROFILE_HREF,
        group: 'Personal',
        scope: 'ME',
        keywords: ['you', 'account', 'name', 'email', 'delete account'],
    },
    {
        title: 'Security',
        href: '/settings/security',
        group: 'Personal',
        scope: 'ME',
        keywords: ['password', 'two-factor', '2fa', 'login'],
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        group: 'Personal',
        scope: 'ME',
        keywords: [
            'theme',
            'light',
            'display',
            'preferences',
            'language',
            'langue',
            'locale',
            'العربية',
        ],
    },
    {
        title: 'General',
        href: '/settings/workspace',
        group: 'Workspace',
        scope: 'WORKSPACE',
        keywords: ['workspace', 'simple mode', 'preferences', 'tenant'],
        ownerOnly: true,
    },
    {
        title: 'Members',
        href: '/settings/people',
        group: 'Workspace',
        scope: 'WORKSPACE',
        keywords: ['people', 'invite', 'role', 'team', 'users'],
        adminOnly: true,
    },
    {
        title: 'Meetings',
        href: '/settings/meetings',
        group: 'Workspace',
        scope: 'WORKSPACE',
        keywords: ['calendar', 'booking', 'schedule'],
    },
    {
        title: 'Setup',
        href: '/settings/setup',
        group: 'Workspace',
        scope: 'WORKSPACE',
        keywords: ['get started', 'wizard', 'onboarding', 'first run'],
    },
    {
        title: 'Properties',
        href: '/settings/attributes',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['custom attributes', 'fields', 'definitions'],
        permission: 'settings.attributes',
    },
    {
        title: 'Pipelines',
        href: '/settings/pipelines',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['stages', 'deals', 'board'],
        permission: 'settings.pipelines',
    },
    {
        title: 'Qualification',
        href: '/settings/qualify',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['qualify', 'lead score', 'thresholds'],
        adminOnly: true,
    },
    {
        title: 'Quotas',
        href: '/settings/quotas',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['targets', 'forecast'],
        adminOnly: true,
    },
    {
        title: 'Record layouts',
        href: '/settings/record-layouts',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['hub', 'cards', 'layout'],
        permission: 'settings.attributes',
        adminOnly: true,
    },
    {
        title: 'Playbooks',
        href: '/settings/playbooks',
        group: 'CRM',
        scope: 'CRM',
        keywords: ['scripts', 'coaching'],
        adminOnly: true,
    },
    {
        title: 'WhatsApp',
        href: '/settings/evolution',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['evolution', 'channel', 'phone'],
        permission: 'settings.integrations',
    },
    {
        title: 'WhatsApp Cloud',
        href: '/settings/whatsapp',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['qr', 'personal phone'],
        permission: 'settings.integrations',
    },
    {
        title: 'WhatsApp Business',
        href: '/settings/whatsapp-business',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['cloud api', 'facebook'],
        permission: 'settings.integrations',
    },
    {
        title: 'Meta',
        href: '/settings/meta',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['facebook', 'ads', 'leads', 'instagram'],
        permission: 'settings.integrations',
    },
    {
        title: 'Channels',
        href: '/settings/channels',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['desk', 'email', 'evodesk', 'inbox'],
        permission: 'settings.integrations',
    },
    {
        title: 'SMS',
        href: '/settings/sms',
        group: 'Communication',
        scope: 'CHANNEL',
        keywords: ['gateway', 'text'],
        permission: 'settings.integrations',
        requiresSmsFeature: true,
        adminOnly: true,
    },
    {
        title: 'Apps',
        href: '/settings/apps',
        group: 'Integrations',
        scope: 'INTEGRATION',
        keywords: ['marketplace', 'directory'],
        permission: 'settings.integrations',
    },
    {
        title: 'Connectors',
        href: '/settings/connectors',
        group: 'Integrations',
        scope: 'INTEGRATION',
        keywords: ['google', 'gmail', 'calendar'],
        permission: 'settings.integrations',
    },
    {
        title: 'Agent',
        href: '/settings/agent',
        group: 'Integrations',
        scope: 'INTEGRATION',
        keywords: ['agent', 'openmanus', 'plugins', 'onboarding', 'runtime'],
        permission: 'settings.integrations',
        adminOnly: true,
    },
    {
        title: 'Permissions',
        href: '/settings/permissions',
        group: 'Developer',
        scope: 'DEVELOPER',
        keywords: ['admin', 'capabilities', 'roles'],
        adminOnly: true,
    },
    {
        title: 'Audit trail',
        href: '/settings/audit',
        group: 'Developer',
        scope: 'DEVELOPER',
        keywords: ['admin', 'log', 'history'],
        adminOnly: true,
    },
    {
        title: 'System health',
        href: '/settings/system-health',
        group: 'Developer',
        scope: 'DEVELOPER',
        keywords: ['admin', 'status', 'queues'],
        adminOnly: true,
    },
];

export const WIDE_SETTINGS_COMPONENTS = new Set([
    'settings/people',
    'settings/attributes',
    'settings/pipelines',
    'settings/record-layouts',
    'settings/connectors',
    'settings/system-health',
    'settings/audit',
    'settings/playbooks',
    'settings/quotas',
    'settings/meta',
    'settings/apps/meta',
    'settings/sms',
    'settings/permissions',
]);

export type SettingsVisibilityInput = {
    capabilities: string[];
    canManageSettings: boolean;
    isOwner: boolean;
    smsEnabled: boolean;
};

export function isSettingsDestinationVisible(
    destination: SettingsDestination,
    visibility: SettingsVisibilityInput,
): boolean {
    if (destination.requiresSmsFeature && !visibility.smsEnabled) {
        return false;
    }

    if (destination.ownerOnly && !visibility.isOwner) {
        return false;
    }

    if (destination.adminOnly && !visibility.canManageSettings) {
        return false;
    }

    return (
        !destination.permission ||
        visibility.capabilities.includes(destination.permission)
    );
}

export function visibleSettingsDestinations(
    visibility: SettingsVisibilityInput,
): SettingsDestination[] {
    return SETTINGS_DESTINATIONS.filter((destination) =>
        isSettingsDestinationVisible(destination, visibility),
    );
}

export function filterSettingsDestinations(
    destinations: SettingsDestination[],
    query: string,
): SettingsDestination[] {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return destinations;
    }

    return destinations.filter((destination) => {
        const haystack = [
            destination.title,
            destination.group,
            destination.scope,
            destination.href,
            ...destination.keywords,
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(needle);
    });
}

export function groupSettingsDestinations(
    destinations: SettingsDestination[],
): SettingsNavGroup[] {
    return SETTINGS_GROUP_ORDER.map((title) => ({
        title,
        scope: SETTINGS_SCOPE_BY_GROUP[title],
        items: destinations.filter((destination) => destination.group === title),
    })).filter((group) => group.items.length > 0);
}

export function isSettingsNavActive(
    href: string,
    currentPath: string,
): boolean {
    if (currentPath === href) {
        return true;
    }

    if (href === SETTINGS_PROFILE_HREF) {
        return false;
    }

    return currentPath.startsWith(`${href}/`);
}
