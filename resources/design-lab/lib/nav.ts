import type { LabRoute, LabRoom } from './routes';

export type NavChild = {
    id: string;
    label: string;
    to: LabRoute;
};

export type NavItem = {
    id: LabRoom;
    label: string;
    to: LabRoute;
    children?: NavChild[];
};

export type NavSection = {
    id: string;
    label: string | null;
    items: NavItem[];
};

export const OUTBOUND_CHILDREN: NavChild[] = [
    { id: 'overview', label: 'Vue d’ensemble', to: { name: 'outbound', view: 'overview' } },
    { id: 'campaigns', label: 'Campagnes', to: { name: 'outbound', view: 'campaigns' } },
    { id: 'sequences', label: 'Séquences', to: { name: 'outbound', view: 'sequences' } },
    { id: 'mailboxes', label: 'Boîtes mail', to: { name: 'outbound', view: 'mailboxes' } },
    { id: 'domains', label: 'Domaines', to: { name: 'outbound', view: 'domains' } },
    { id: 'templates', label: 'Modèles', to: { name: 'outbound', view: 'templates' } },
    { id: 'warmup', label: 'Warmup', to: { name: 'outbound', view: 'warmup' } },
    { id: 'outbox', label: 'Outbox', to: { name: 'outbound', view: 'outbox' } },
    { id: 'suppressions', label: 'Suppressions', to: { name: 'outbound', view: 'suppressions' } },
    { id: 'reports', label: 'Rapports', to: { name: 'outbound', view: 'reports' } },
];

export const ADS_CHILDREN: NavChild[] = [
    { id: 'overview', label: 'Vue d’ensemble', to: { name: 'ads', view: 'overview' } },
    { id: 'accounts', label: 'Comptes', to: { name: 'ads', view: 'accounts' } },
    { id: 'campaigns', label: 'Campagnes', to: { name: 'ads', view: 'campaigns' } },
    { id: 'adsets', label: 'Ensembles', to: { name: 'ads', view: 'adsets' } },
    { id: 'ads', label: 'Publicités', to: { name: 'ads', view: 'creatives' } },
    { id: 'leads', label: 'Leads pubs', to: { name: 'ads', view: 'leads' } },
    { id: 'audiences', label: 'Audiences', to: { name: 'ads', view: 'audiences' } },
    { id: 'attribution', label: 'Attribution', to: { name: 'ads', view: 'attribution' } },
];

export const REPORT_CHILDREN: NavChild[] = [
    { id: 'overview', label: 'Vue d’ensemble', to: { name: 'reports', view: 'overview' } },
    { id: 'pipeline', label: 'Pipeline', to: { name: 'reports', view: 'pipeline' } },
    { id: 'leads', label: 'Leads', to: { name: 'reports', view: 'leads' } },
    { id: 'outbound', label: 'Outbound', to: { name: 'reports', view: 'outbound' } },
    { id: 'ads', label: 'Pubs', to: { name: 'reports', view: 'ads' } },
    { id: 'desk', label: 'Desk', to: { name: 'reports', view: 'desk' } },
    { id: 'activity', label: 'Activité', to: { name: 'reports', view: 'activity' } },
    { id: 'dashboards', label: 'Dashboards', to: { name: 'reports', view: 'dashboards' } },
    { id: 'builder', label: 'Report Builder', to: { name: 'reports', view: 'builder' } },
    { id: 'scheduled', label: 'Rapports planifiés', to: { name: 'reports', view: 'scheduled' } },
];

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'top',
        label: null,
        items: [
            { id: 'accueil', label: 'Accueil', to: { name: 'accueil' } },
            { id: 'tokens', label: 'Jetons', to: { name: 'tokens' } },
            { id: 'shell', label: 'Shell', to: { name: 'shell' } },
            { id: 'components', label: 'Composants', to: { name: 'components' } },
            { id: 'data', label: 'Données', to: { name: 'data' } },
            { id: 'inbox', label: 'Inbox', to: { name: 'inbox' } },
        ],
    },
    {
        id: 'vendre',
        label: 'Vendre',
        items: [
            { id: 'contacts', label: 'Contacts', to: { name: 'contacts' } },
            { id: 'companies', label: 'Sociétés', to: { name: 'companies' } },
            { id: 'leads', label: 'Leads', to: { name: 'leads' } },
            { id: 'deals', label: 'Affaires', to: { name: 'deals' } },
            { id: 'quotes', label: 'Devis', to: { name: 'quotes' } },
            { id: 'activities', label: 'Activités', to: { name: 'activities' } },
        ],
    },
    {
        id: 'prospecter',
        label: 'Prospecter',
        items: [
            { id: 'outbound', label: 'Outbound', to: { name: 'outbound' }, children: OUTBOUND_CHILDREN },
            { id: 'ads', label: 'Pubs', to: { name: 'ads' }, children: ADS_CHILDREN },
        ],
    },
    {
        id: 'servir',
        label: 'Servir',
        items: [{ id: 'tickets', label: 'Tickets', to: { name: 'tickets' } }],
    },
    {
        id: 'analyser',
        label: 'Analyser',
        items: [{ id: 'reports', label: 'Rapports', to: { name: 'reports' }, children: REPORT_CHILDREN }],
    },
    {
        id: 'automatiser',
        label: 'Automatiser',
        items: [
            { id: 'segments', label: 'Segments', to: { name: 'segments' } },
            { id: 'workflows', label: 'Workflows', to: { name: 'workflows' } },
        ],
    },
];
