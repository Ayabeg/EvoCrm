import type {
    DomainListQueryAdapter,
    ListQueryFilterKey,
    ListQueryObject,
} from '@/lib/list-query/types';

const WORKSPACE_FILTER_KEYS = [
    'owner',
    'created',
    'last_activity',
    'status',
    'stage',
    'city',
    'wilaya',
    'unanswered',
    'unassigned',
    'priority',
    'channel',
    'attention',
] as const satisfies readonly ListQueryFilterKey[];

const QUOTE_FILTER_KEYS = [
    'owner',
    'created',
    'status',
] as const satisfies readonly ListQueryFilterKey[];

const LEAD_FILTER_KEYS = [
    'created',
    'status',
] as const satisfies readonly ListQueryFilterKey[];

const CONTACT_ADAPTER: DomainListQueryAdapter = {
    object: 'contact',
    searchParam: 'q',
    filterKeys: WORKSPACE_FILTER_KEYS,
    extras: [],
    supportsQuery: true,
};

const COMPANY_ADAPTER: DomainListQueryAdapter = {
    object: 'company',
    searchParam: 'q',
    filterKeys: WORKSPACE_FILTER_KEYS,
    extras: [],
    supportsQuery: true,
};

const DEAL_ADAPTER: DomainListQueryAdapter = {
    object: 'deal',
    searchParam: 'q',
    filterKeys: WORKSPACE_FILTER_KEYS,
    extras: ['pipeline'],
    supportsQuery: true,
};

const QUOTE_ADAPTER: DomainListQueryAdapter = {
    object: 'quote',
    searchParam: 'q',
    filterKeys: QUOTE_FILTER_KEYS,
    extras: [],
    supportsQuery: true,
};

const TICKET_ADAPTER: DomainListQueryAdapter = {
    object: 'ticket',
    searchParam: 'q',
    filterKeys: WORKSPACE_FILTER_KEYS,
    extras: [],
    supportsQuery: true,
};

const LEAD_ADAPTER: DomainListQueryAdapter = {
    object: 'lead',
    searchParam: 'q',
    filterKeys: LEAD_FILTER_KEYS,
    extras: [],
    supportsQuery: true,
};

const ADAPTERS: Record<ListQueryObject, DomainListQueryAdapter> = {
    contact: CONTACT_ADAPTER,
    company: COMPANY_ADAPTER,
    deal: DEAL_ADAPTER,
    quote: QUOTE_ADAPTER,
    ticket: TICKET_ADAPTER,
    lead: LEAD_ADAPTER,
};

export function listQueryAdapter(object: ListQueryObject): DomainListQueryAdapter {
    return ADAPTERS[object];
}

export function listQueryObjectFromPath(basePath: string): ListQueryObject {
    if (basePath.startsWith('/crm/companies')) {
        return 'company';
    }

    if (basePath.startsWith('/crm/deals')) {
        return 'deal';
    }

    if (basePath.startsWith('/crm/quotes')) {
        return 'quote';
    }

    if (basePath.startsWith('/crm/leads')) {
        return 'lead';
    }

    if (basePath.startsWith('/crm/tickets')) {
        return 'ticket';
    }

    return 'contact';
}
