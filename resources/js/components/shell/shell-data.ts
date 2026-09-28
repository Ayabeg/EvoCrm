export type ShellMode = 'menu' | 'agents' | 'search';

export type ShellNavItem = {
    id: string;
    label: string;
    count?: number;
};

export type ShellNavSection = {
    id: string;
    label: string;
    items: ShellNavItem[];
};

export const SHELL_TAGLINE = 'Close more deals per hour.';

export type RoomRow = {
    label: string;
    value: string;
    badge?: boolean;
};

export type Room = {
    title: string;
    meta: string;
    rows: RoomRow[];
};

export const ROOMS: Record<string, Room> = {
    home: {
        title: 'Home',
        meta: 'Evotechly · Algiers',
        rows: [
            { label: 'Inbox', value: '12', badge: true },
            { label: 'Leads', value: '34', badge: true },
            { label: 'Next meeting', value: '14:30' },
        ],
    },
    inbox: {
        title: 'Inbox',
        meta: '12 open',
        rows: [
            { label: 'Atlas renewal', value: 'Waiting' },
            { label: 'Hakim Rahal', value: 'New' },
        ],
    },
    companies: {
        title: 'Companies',
        meta: 'Evotechly',
        rows: [{ label: 'Evotechly', value: 'Algiers' }],
    },
    contacts: {
        title: 'Contacts',
        meta: 'People on open deals',
        rows: [{ label: 'Emma Green', value: 'Admin' }],
    },
    leads: {
        title: 'Leads',
        meta: '34 unworked',
        rows: [{ label: 'Hakim Rahal', value: 'Inbound', badge: true }],
    },
    deals: {
        title: 'Deals',
        meta: 'Open pipeline',
        rows: [{ label: 'Atlas renewal', value: 'Evotechly' }],
    },
    'lead-os': {
        title: 'Lead OS',
        meta: 'Scoring',
        rows: [{ label: 'Hakim Rahal', value: 'Inbound' }],
    },
    tickets: {
        title: 'Tickets',
        meta: 'After the sale',
        rows: [{ label: 'Delivery slip', value: 'Open' }],
    },
    meetings: {
        title: 'Meetings',
        meta: 'Today',
        rows: [{ label: 'Hakim Rahal', value: '14:30' }],
    },
    quotes: {
        title: 'Quotes',
        meta: 'Ready to send',
        rows: [{ label: 'Atlas renewal', value: 'Draft' }],
    },
    outbound: {
        title: 'Outbound',
        meta: 'Sequences',
        rows: [{ label: 'Closer draft', value: 'Ready' }],
    },
    whatsapp: {
        title: 'WhatsApp',
        meta: 'Channel',
        rows: [{ label: 'Desk', value: 'Connected' }],
    },
    adhub: {
        title: 'AdHub',
        meta: 'Campaigns',
        rows: [{ label: 'Spend', value: 'Today' }],
    },
    reports: {
        title: 'Reports',
        meta: 'This week',
        rows: [{ label: 'Pipeline', value: 'Open' }],
    },
    settings: {
        title: 'Settings',
        meta: 'Emma Green · Admin',
        rows: [{ label: 'Workspace', value: 'Algiers' }],
    },
};

export const NAV_SECTIONS: ShellNavSection[] = [
    {
        id: 'workspace',
        label: 'Workspace',
        items: [
            { id: 'home', label: 'Home' },
            { id: 'inbox', label: 'Inbox', count: 12 },
        ],
    },
    {
        id: 'crm',
        label: 'CRM',
        items: [
            { id: 'companies', label: 'Companies' },
            { id: 'contacts', label: 'Contacts' },
            { id: 'leads', label: 'Leads', count: 34 },
            { id: 'deals', label: 'Deals' },
            { id: 'lead-os', label: 'Lead OS' },
        ],
    },
    {
        id: 'work',
        label: 'Work',
        items: [
            { id: 'tickets', label: 'Tickets' },
            { id: 'meetings', label: 'Meetings' },
            { id: 'quotes', label: 'Quotes' },
            { id: 'outbound', label: 'Outbound' },
        ],
    },
    {
        id: 'channels',
        label: 'Channels',
        items: [
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'adhub', label: 'AdHub' },
            { id: 'reports', label: 'Reports' },
        ],
    },
];

export const SETTINGS_ITEM: ShellNavItem = {
    id: 'settings',
    label: 'Settings',
};

export const AGENTS = [
    {
        id: 'closer',
        name: 'Closer',
        job: 'Drafts the next line that moves a live deal.',
        status: 'Ready',
    },
    {
        id: 'qualifier',
        name: 'Qualifier',
        job: 'Scores inbound before it reaches the board.',
        status: 'On',
    },
    {
        id: 'quote-desk',
        name: 'Quote desk',
        job: 'Turns an accepted scope into a sendable quote.',
        status: 'Idle',
    },
    {
        id: 'after-sale',
        name: 'After-sale',
        job: 'Opens the ticket when delivery slips.',
        status: 'Ready',
    },
] as const;

export type SearchHit = {
    id: string;
    kind: 'Deal' | 'Company' | 'Contact' | 'Lead';
    title: string;
    detail: string;
};

export const SEARCH_INDEX: SearchHit[] = [
    {
        id: 'deal-atlas',
        kind: 'Deal',
        title: 'Atlas renewal',
        detail: 'Evotechly',
    },
    {
        id: 'company-evotechly',
        kind: 'Company',
        title: 'Evotechly',
        detail: 'Algiers',
    },
    {
        id: 'contact-emma',
        kind: 'Contact',
        title: 'Emma Green',
        detail: 'Admin',
    },
    { id: 'lead-hakim', kind: 'Lead', title: 'Hakim Rahal', detail: 'Inbound' },
];

export function findNavItem(id: string): ShellNavItem {
    for (const section of NAV_SECTIONS) {
        const item = section.items.find((entry) => entry.id === id);

        if (item) {
            return item;
        }
    }

    return SETTINGS_ITEM;
}
