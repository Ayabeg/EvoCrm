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
    Robot,
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
                label: 'Accueil',
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
            {
                id: 'agents',
                label: 'Agents',
                href: '/agents',
                icon: Robot,
                activePaths: ['/agents'],
            },
        ],
    },
    {
        id: 'sell',
        label: 'Vendre',
        items: [
            {
                id: 'contacts',
                label: 'Contacts',
                href: '/crm/contacts',
                icon: Users,
            },
            {
                id: 'companies',
                label: 'Sociétés',
                href: '/crm/companies',
                icon: Buildings,
            },
            { id: 'leads', label: 'Leads', href: '/crm/leads', icon: UserList },
            {
                id: 'deals',
                label: 'Affaires',
                href: '/crm/deals',
                icon: Handshake,
            },
            {
                id: 'quotes',
                label: 'Devis',
                href: '/crm/quotes',
                icon: FileText,
            },
            {
                id: 'activities',
                label: 'Activités',
                href: '/crm/activities',
                icon: CheckSquare,
            },
        ],
    },
    {
        id: 'prospect',
        label: 'Prospecter',
        items: [
            {
                id: 'outbound',
                label: 'Outbound',
                href: '/outbound',
                icon: PaperPlaneTilt,
                children: [
                    {
                        id: 'outbound-home',
                        label: "Vue d'ensemble",
                        href: '/outbound',
                        exact: true,
                    },
                    {
                        id: 'outbound-campaigns',
                        label: 'Campagnes',
                        href: '/outbound/campaigns',
                    },
                    {
                        id: 'outbound-sequences',
                        label: 'Séquences',
                        href: '/outbound/sequences',
                    },
                    {
                        id: 'outbound-mailboxes',
                        label: 'Boîtes mail',
                        href: '/outbound/mailboxes',
                    },
                    {
                        id: 'outbound-domains',
                        label: 'Domaines',
                        href: '/outbound/domains',
                    },
                    {
                        id: 'outbound-templates',
                        label: 'Modèles',
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
                        label: 'Rapports',
                        href: '/reports/outbound',
                    },
                ],
            },
            {
                id: 'ads',
                label: 'Pubs',
                href: '/ads',
                icon: Megaphone,
                feature: 'ads',
                children: [
                    {
                        id: 'ads-home',
                        label: "Vue d'ensemble",
                        href: '/ads',
                        exact: true,
                    },
                    {
                        id: 'ads-campaigns',
                        label: 'Campagnes',
                        href: '/ads/campaigns',
                    },
                    {
                        id: 'ads-sets',
                        label: 'Ensembles',
                        href: '/ads/ad-sets',
                    },
                    { id: 'ads-ads', label: 'Publicités', href: '/ads/ads' },
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
        label: 'Servir',
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
        label: 'Analyser',
        items: [
            {
                id: 'reports',
                label: 'Rapports',
                href: '/reports',
                icon: ChartBar,
                children: [
                    {
                        id: 'reports-home',
                        label: "Vue d'ensemble",
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
                    { id: 'reports-ads', label: 'Pubs', href: '/reports/ads' },
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
        label: 'Automatiser',
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
    label: 'Paramètres',
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

    // Agents is a shell-level workspace and stays reachable in simple mode.
    return id === 'agents' || allowed.has(id);
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
