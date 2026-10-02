import {
    ChartBar,
    Envelope,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Megaphone,
    PaperPlaneTilt,
    Ticket,
    Users,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { LaunchFeatures } from '@/hooks/use-simple-mode';

export type NavFeature = 'ads' | 'tickets' | 'warmup' | 'report_builder';
export type NavPermission =
    | 'crm.view'
    | 'reports.manage'
    | 'automation.manage'
    | 'ads.manage'
    | 'outbound.manage'
    | 'settings.integrations'
    | 'settings.people'
    | 'settings.pipelines'
    | 'settings.attributes'
    | 'settings.permissions';

/** The canonical Menu tree. Labels are translation keys, never display text. */
export type NavChild = {
    id: string;
    labelKey: string;
    href: string;
    exact?: boolean;
    activePaths?: string[];
    feature?: NavFeature;
    permission?: NavPermission;
};

export type NavItem = {
    id: string;
    labelKey: string;
    href: string;
    icon: Icon;
    also?: string[];
    activePaths?: string[];
    exact?: boolean;
    feature?: NavFeature;
    permission?: NavPermission;
    children?: NavChild[];
};

export type NavSection = {
    id: string;
    labelKey?: string;
    items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'top',
        items: [
            { id: 'home', labelKey: 'nav.home', href: '/dashboard', icon: House, also: ['/'] },
            { id: 'inbox', labelKey: 'nav.inbox', href: '/inbox', icon: Envelope, also: ['/desk', '/conversations'] },
        ],
    },
    {
        id: 'sell',
        labelKey: 'nav.sections.sell',
        items: [
            {
                id: 'crm', labelKey: 'nav.crm.title', href: '/crm/contacts', icon: Users, permission: 'crm.view',
                children: [
                    { id: 'contacts', labelKey: 'nav.crm.contacts', href: '/crm/contacts' },
                    { id: 'companies', labelKey: 'nav.crm.companies', href: '/crm/companies' },
                    { id: 'leads', labelKey: 'nav.crm.leads', href: '/crm/leads' },
                    { id: 'activities', labelKey: 'nav.crm.activities', href: '/crm/activities' },
                    { id: 'segments', labelKey: 'nav.crm.segments', href: '/crm/segments' },
                ],
            },
            {
                id: 'deals', labelKey: 'nav.deals.title', href: '/crm/deals', icon: Handshake, permission: 'crm.view',
                children: [
                    { id: 'deals-all', labelKey: 'nav.deals.all', href: '/crm/deals', exact: true },
                    { id: 'deals-pipeline', labelKey: 'nav.deals.pipeline', href: '/crm/deals/board' },
                ],
            },
            {
                id: 'quotes', labelKey: 'nav.quotes.title', href: '/crm/quotes', icon: FileText, permission: 'crm.view',
                children: [{ id: 'quotes-all', labelKey: 'nav.quotes.all', href: '/crm/quotes' }],
            },
        ],
    },
    {
        id: 'prospect',
        labelKey: 'nav.sections.prospect',
        items: [
            {
                id: 'outbound', labelKey: 'nav.outbound.title', href: '/outbound', icon: PaperPlaneTilt, permission: 'outbound.manage',
                children: [
                    { id: 'outbound-home', labelKey: 'nav.outbound.overview', href: '/outbound', exact: true },
                    { id: 'outbound-campaigns', labelKey: 'nav.outbound.campaigns', href: '/outbound/campaigns' },
                    { id: 'outbound-sequences', labelKey: 'nav.outbound.sequences', href: '/outbound/sequences' },
                    { id: 'outbound-mailboxes', labelKey: 'nav.outbound.mailboxes', href: '/outbound/mailboxes' },
                    { id: 'outbound-domains', labelKey: 'nav.outbound.domains', href: '/outbound/domains' },
                    { id: 'outbound-templates', labelKey: 'nav.outbound.templates', href: '/outbound/templates' },
                    { id: 'outbound-warmup', labelKey: 'nav.outbound.warmup', href: '/outbound/warmup', feature: 'warmup' },
                    { id: 'outbound-outbox', labelKey: 'nav.outbound.outbox', href: '/outbound/outbox' },
                    { id: 'outbound-suppressions', labelKey: 'nav.outbound.suppressions', href: '/outbound/suppressions' },
                ],
            },
            {
                id: 'ads', labelKey: 'nav.ads.title', href: '/ads', icon: Megaphone, feature: 'ads', permission: 'ads.manage',
                children: [
                    { id: 'ads-home', labelKey: 'nav.ads.overview', href: '/ads', exact: true },
                    { id: 'ads-campaigns', labelKey: 'nav.ads.campaigns', href: '/ads/campaigns' },
                    { id: 'ads-sets', labelKey: 'nav.ads.adSets', href: '/ads/ad-sets' },
                    { id: 'ads-ads', labelKey: 'nav.ads.advertisements', href: '/ads/ads' },
                    { id: 'ads-audiences', labelKey: 'nav.ads.audiences', href: '/ads/audiences' },
                    { id: 'ads-attribution', labelKey: 'nav.ads.attribution', href: '/ads/attribution' },
                ],
            },
        ],
    },
    {
        id: 'serve',
        labelKey: 'nav.sections.serve',
        items: [{
            id: 'tickets', labelKey: 'nav.tickets.title', href: '/crm/tickets', icon: Ticket, feature: 'tickets',
            children: [
                { id: 'tickets-all', labelKey: 'nav.tickets.all', href: '/crm/tickets' },
                { id: 'tickets-board', labelKey: 'nav.tickets.board', href: '/crm/tickets/board' },
            ],
        }],
    },
    {
        id: 'analyze',
        labelKey: 'nav.sections.analyze',
        items: [{
            id: 'reports', labelKey: 'nav.reports.title', href: '/reports', icon: ChartBar,
            children: [
                { id: 'reports-home', labelKey: 'nav.reports.overview', href: '/reports', exact: true },
                { id: 'reports-pipeline', labelKey: 'nav.reports.pipeline', href: '/reports/pipeline' },
                { id: 'reports-leads', labelKey: 'nav.reports.leads', href: '/reports/sales' },
                { id: 'reports-outbound', labelKey: 'nav.reports.outbound', href: '/reports/outbound' },
                { id: 'reports-ads', labelKey: 'nav.reports.ads', href: '/reports/ads' },
                { id: 'reports-builder', labelKey: 'nav.reports.builder', href: '/crm/report-builder', feature: 'report_builder', permission: 'reports.manage' },
            ],
        }],
    },
    {
        id: 'automate',
        labelKey: 'nav.sections.automate',
        items: [{
            id: 'automation', labelKey: 'nav.automation.title', href: '/crm/workflows', icon: FlowArrow, permission: 'automation.manage',
            children: [
                { id: 'automation-workflows', labelKey: 'nav.automation.workflows', href: '/crm/workflows' },
                { id: 'automation-segments', labelKey: 'nav.automation.segments', href: '/crm/segments' },
            ],
        }],
    },
];

export const SETTINGS_NAV: NavItem = {
    id: 'settings', labelKey: 'nav.settings.title', href: '/settings', icon: GearSix,
    children: [
        { id: 'settings-workspace', labelKey: 'nav.settings.workspace', href: '/settings/workspace' },
        { id: 'settings-people', labelKey: 'nav.settings.people', href: '/settings/people', permission: 'settings.people' },
        { id: 'settings-permissions', labelKey: 'nav.settings.permissions', href: '/settings/permissions', permission: 'settings.permissions' },
        { id: 'settings-pipelines', labelKey: 'nav.settings.pipelines', href: '/settings/pipelines', permission: 'settings.pipelines' },
        { id: 'settings-attributes', labelKey: 'nav.settings.properties', href: '/settings/attributes', permission: 'settings.attributes' },
        { id: 'settings-apps', labelKey: 'nav.settings.apps', href: '/settings/apps', permission: 'settings.integrations' },
        { id: 'settings-channels', labelKey: 'nav.settings.channels', href: '/settings/channels', permission: 'settings.integrations' },
        { id: 'settings-whatsapp', labelKey: 'nav.settings.whatsapp', href: '/settings/whatsapp', permission: 'settings.integrations' },
        { id: 'settings-meta', labelKey: 'nav.settings.meta', href: '/settings/meta', permission: 'settings.integrations' },
        { id: 'settings-meetings', labelKey: 'nav.settings.meetings', href: '/settings/meetings' },
        { id: 'settings-security', labelKey: 'nav.settings.security', href: '/settings/security' },
        { id: 'settings-appearance', labelKey: 'nav.settings.appearance', href: '/settings/appearance' },
    ],
};

function featureOn(feature: NavFeature | undefined, features: LaunchFeatures): boolean {
    return !feature || Boolean(features[feature]);
}

function permissionOn(permission: NavPermission | undefined, capabilities: Set<string> | null): boolean {
    return !permission || !capabilities || capabilities.has(permission);
}

function idAllowed(id: string, simpleMode: boolean, allowed: Set<string> | null): boolean {
    if (!simpleMode || !allowed) {
        return true;
    }

    if (allowed.has(id)) {
        return true;
    }

    // Simple Mode publishes flat ids (deals, quotes, ...). The canonical
    // tree keeps a distinct child id for stable active-route semantics.
    return allowed.has(id.replace(/-(all|home)$/, ''));
}

export function visibleSections(simpleMode: boolean, allowed: Set<string> | null, features: LaunchFeatures, capabilities: Set<string> | null = null): NavSection[] {
    return NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items
            .filter((item) => featureOn(item.feature, features) && permissionOn(item.permission, capabilities))
            .map((item) => ({
                ...item,
                children: item.children?.filter((child) => featureOn(child.feature, features) && permissionOn(child.permission, capabilities) && idAllowed(child.id, simpleMode, allowed)),
            }))
            .filter((item) => !simpleMode || idAllowed(item.id, simpleMode, allowed) || Boolean(item.children?.length)),
    })).filter((section) => section.items.length > 0);
}

function normalizePath(path: string): string {
    const pathname = path.split(/[?#]/, 1)[0] || '/';
    const normalized = pathname.replace(/\/+$/, '');

    return normalized || '/';
}

export function pathMatches(path: string, href: string, exact = false, also: string[] = [], activePaths: string[] = []): boolean {
    const current = normalizePath(path);

    return [href, ...also, ...activePaths].some((root) => {
        const target = normalizePath(root);

        if (target === '/') {
            return current === '/';
        }

        if (exact) {
            return current === target;
        }

        return current === target || current.startsWith(`${target}/`);
    });
}

export function isNavigationChildActive(path: string, child: NavChild): boolean {
    return pathMatches(path, child.href, child.exact, [], child.activePaths);
}

export function isNavigationItemActive(path: string, item: NavItem): boolean {
    return Boolean(item.children?.some((child) => isNavigationChildActive(path, child))) || pathMatches(path, item.href, item.exact, item.also, item.activePaths);
}

export function activeNavId(path: string, sections: NavSection[]): string | undefined {
    const matches = sections.flatMap((section) => section.items.flatMap((item) => [
        ...(item.children ?? []).filter((child) => isNavigationChildActive(path, child)).map((child) => ({ id: child.id, depth: 2, length: child.href.length })),
        ...(isNavigationItemActive(path, item) ? [{ id: item.id, depth: 1, length: item.href.length }] : []),
    ]));

    return matches.sort(
        (left, right) => right.depth - left.depth || right.length - left.length,
    )[0]?.id;
}

export function activeParentId(path: string, sections: NavSection[]): string | undefined {
    return sections
        .flatMap((section) => section.items)
        .find(
            (item) =>
                item.children?.some((child) =>
                    isNavigationChildActive(path, child),
                ) ||
                (isNavigationItemActive(path, item) &&
                    Boolean(item.children?.length)),
        )?.id;
}

export function visibleSettings(capabilities: Set<string> | null = null): NavItem {
    return {
        ...SETTINGS_NAV,
        children: SETTINGS_NAV.children?.filter((child) =>
            permissionOn(child.permission, capabilities),
        ),
    };
}

export function findNavItem(id: string): NavItem | NavChild {
    if (id === SETTINGS_NAV.id) {
        return SETTINGS_NAV;
    }

    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            if (item.id === id) {
                return item;
            }

            const child = item.children?.find((entry) => entry.id === id);

            if (child) {
                return child;
            }
        }
    }

    return SETTINGS_NAV;
}
