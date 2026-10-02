import {
    Buildings,
    ChartBar,
    CheckSquare,
    Envelope,
    FileText,
    FlowArrow,
    GearSix,
    Handshake,
    House,
    Megaphone,
    PaperPlaneTilt,
    Ticket,
    UserList,
    Users,
    UsersThree,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { LaunchFeatures } from '@/hooks/use-simple-mode';

export type NavFeature = 'ads' | 'tickets' | 'warmup' | 'report_builder';

export type NavChild = {
    id: string;
    label: string;
    href: string;
    exact?: boolean;
    feature?: NavFeature;
};

export type NavItem = {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    also?: string[];
    activePaths?: string[];
    exact?: boolean;
    feature?: NavFeature;
    children?: NavChild[];
};

export type NavSection = {
    id: string;
    label?: string;
    items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'top',
        items: [
            {
                id: 'home',
                label: 'Home',
                href: '/dashboard',
                icon: House,
                also: ['/'],
            },
            {
                id: 'inbox',
                label: 'Inbox',
                href: '/inbox',
                icon: Envelope,
                also: ['/desk', '/conversations'],
            },
        ],
    },
    {
        id: 'sell',
        label: 'Sales',
        items: [
            {
                id: 'contacts',
                label: 'Contacts',
                href: '/crm/contacts',
                icon: Users,
            },
            {
                id: 'companies',
                label: 'Companies',
                href: '/crm/companies',
                icon: Buildings,
            },
            { id: 'leads', label: 'Leads', href: '/crm/leads', icon: UserList },
            {
                id: 'deals',
                label: 'Deals',
                href: '/crm/deals',
                icon: Handshake,
            },
            {
                id: 'quotes',
                label: 'Quotes',
                href: '/crm/quotes',
                icon: FileText,
            },
            {
                id: 'activities',
                label: 'Activities',
                href: '/crm/activities',
                icon: CheckSquare,
            },
        ],
    },
    {
        id: 'prospect',
        label: 'Prospect',
        items: [
            {
                id: 'outbound',
                label: 'Outbound',
                href: '/outbound',
                icon: PaperPlaneTilt,
                children: [
                    {
                        id: 'outbound-home',
                        label: 'Overview',
                        href: '/outbound',
                        exact: true,
                    },
                    {
                        id: 'outbound-campaigns',
                        label: 'Campaigns',
                        href: '/outbound/campaigns',
                    },
                    {
                        id: 'outbound-sequences',
                        label: 'Sequences',
                        href: '/outbound/sequences',
                    },
                    {
                        id: 'outbound-mailboxes',
                        label: 'Mailboxes',
                        href: '/outbound/mailboxes',
                    },
                    {
                        id: 'outbound-domains',
                        label: 'Domains',
                        href: '/outbound/domains',
                    },
                    {
                        id: 'outbound-templates',
                        label: 'Templates',
                        href: '/outbound/templates',
                    },
                    {
                        id: 'outbound-warmup',
                        label: 'Warmup',
                        href: '/outbound/warmup',
                        feature: 'warmup',
                    },
                    {
                        id: 'outbound-outbox',
                        label: 'Outbox',
                        href: '/outbound/outbox',
                    },
                    {
                        id: 'outbound-suppressions',
                        label: 'Suppressions',
                        href: '/outbound/suppressions',
                    },
                    {
                        id: 'outbound-reports',
                        label: 'Reports',
                        href: '/reports/outbound',
                    },
                ],
            },
            {
                id: 'ads',
                label: 'Ads',
                href: '/ads',
                icon: Megaphone,
                feature: 'ads',
                children: [
                    {
                        id: 'ads-home',
                        label: 'Overview',
                        href: '/ads',
                        exact: true,
                    },
                    {
                        id: 'ads-campaigns',
                        label: 'Campaigns',
                        href: '/ads/campaigns',
                    },
                    {
                        id: 'ads-sets',
                        label: 'Ad sets',
                        href: '/ads/ad-sets',
                    },
                    { id: 'ads-ads', label: 'Advertisements', href: '/ads/ads' },
                    {
                        id: 'ads-audiences',
                        label: 'Audiences',
                        href: '/ads/audiences',
                    },
                    {
                        id: 'ads-attribution',
                        label: 'Attribution',
                        href: '/ads/attribution',
                    },
                ],
            },
        ],
    },
    {
        id: 'serve',
        label: 'Serve',
        items: [
            {
                id: 'tickets',
                label: 'Tickets',
                href: '/crm/tickets',
                icon: Ticket,
                feature: 'tickets',
            },
        ],
    },
    {
        id: 'analyze',
        label: 'Analyze',
        items: [
            {
                id: 'reports',
                label: 'Reports',
                href: '/reports',
                icon: ChartBar,
                children: [
                    {
                        id: 'reports-home',
                        label: 'Overview',
                        href: '/reports',
                        exact: true,
                    },
                    {
                        id: 'reports-pipeline',
                        label: 'Pipeline',
                        href: '/reports/pipeline',
                    },
                    {
                        id: 'reports-leads',
                        label: 'Leads',
                        href: '/reports/sales',
                    },
                    {
                        id: 'reports-outbound',
                        label: 'Outbound',
                        href: '/reports/outbound',
                    },
                    { id: 'reports-ads', label: 'Ads', href: '/reports/ads' },
                    {
                        id: 'reports-builder',
                        label: 'Report Builder',
                        href: '/crm/report-builder',
                        feature: 'report_builder',
                    },
                ],
            },
        ],
    },
    {
        id: 'automate',
        label: 'Automate',
        items: [
            {
                id: 'segments',
                label: 'Segments',
                href: '/crm/segments',
                icon: UsersThree,
            },
            {
                id: 'workflows',
                label: 'Workflows',
                href: '/crm/workflows',
                icon: FlowArrow,
                also: ['/automation'],
            },
        ],
    },
];

export const SETTINGS_NAV: NavItem = {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: GearSix,
};

function featureOn(
    feature: NavFeature | undefined,
    features: LaunchFeatures,
): boolean {
    if (!feature) {
        return true;
    }

    return Boolean(features[feature]);
}

function idAllowed(
    id: string,
    simpleMode: boolean,
    allowed: Set<string> | null,
): boolean {
    if (!simpleMode || !allowed) {
        return true;
    }

    return allowed.has(id);
}

export function visibleSections(
    simpleMode: boolean,
    allowed: Set<string> | null,
    features: LaunchFeatures,
): NavSection[] {
    return NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items
            .filter(
                (item) =>
                    featureOn(item.feature, features) &&
                    idAllowed(item.id, simpleMode, allowed),
            )
            .map((item) => ({
                ...item,
                children: item.children?.filter(
                    (child) =>
                        featureOn(child.feature, features) &&
                        idAllowed(item.id, simpleMode, allowed),
                ),
            })),
    })).filter((section) => section.items.length > 0);
}

function pathMatches(
    path: string,
    href: string,
    exact = false,
    also: string[] = [],
    activePaths: string[] = [],
): boolean {
    const roots = [href, ...also, ...activePaths];

    return roots.some((root) => {
        if (root === '/') {
            return path === '/';
        }

        if (exact) {
            return path === root;
        }

        return path === root || path.startsWith(`${root}/`);
    });
}

export function activeNavId(
    path: string,
    sections: NavSection[],
): string | undefined {
    const matches: { id: string; href: string }[] = [];

    sections.forEach((section) => {
        section.items.forEach((item) => {
            if (
                pathMatches(
                    path,
                    item.href,
                    item.exact,
                    item.also,
                    item.activePaths,
                )
            ) {
                matches.push({ id: item.id, href: item.href });
            }

            item.children?.forEach((child) => {
                if (pathMatches(path, child.href, child.exact)) {
                    matches.push({ id: child.id, href: child.href });
                }
            });
        });
    });

    return matches.sort(
        (left, right) => right.href.length - left.href.length,
    )[0]?.id;
}
