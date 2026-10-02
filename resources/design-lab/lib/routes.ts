export type LabRoute =
    | { name: 'accueil' }
    | { name: 'tokens' }
    | { name: 'shell' }
    | { name: 'components' }
    | { name: 'data' }
    | { name: 'inbox' }
    | { name: 'contacts' }
    | { name: 'contact'; id: string }
    | { name: 'companies' }
    | { name: 'company'; id: string }
    | { name: 'leads' }
    | { name: 'deals' }
    | { name: 'deal'; id: string }
    | { name: 'quotes' }
    | { name: 'devis'; id: string }
    | { name: 'activities' }
    | { name: 'outbound'; view?: string }
    | { name: 'ads'; view?: string }
    | { name: 'campaign'; id: string }
    | { name: 'tickets' }
    | { name: 'reports'; view?: string }
    | { name: 'segments' }
    | { name: 'workflows' }
    | { name: 'settings' };

export type LabRoom = LabRoute['name'];

function isStandalone(): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    return !window.location.pathname.startsWith('/design-lab');
}

export function routePath(route: LabRoute): string {
    switch (route.name) {
        case 'accueil':
            return '/';
        case 'tokens':
            return '/tokens';
        case 'shell':
            return '/shell';
        case 'components':
            return '/components';
        case 'data':
            return '/data';
        case 'inbox':
            return '/inbox';
        case 'contacts':
            return '/contacts';
        case 'contact':
            return `/contacts/${route.id}`;
        case 'companies':
            return '/companies';
        case 'company':
            return `/companies/${route.id}`;
        case 'leads':
            return '/leads';
        case 'deals':
            return '/deals';
        case 'deal':
            return `/deals/${route.id}`;
        case 'quotes':
            return '/quotes';
        case 'devis':
            return `/quotes/${route.id}`;
        case 'activities':
            return '/activities';
        case 'outbound':
            return route.view && route.view !== 'overview' ? `/outbound/${route.view}` : '/outbound';
        case 'ads':
            return route.view && route.view !== 'overview' ? `/ads/${route.view}` : '/ads';
        case 'campaign':
            return `/ads/campaigns/${route.id}`;
        case 'tickets':
            return '/tickets';
        case 'reports':
            return route.view && route.view !== 'overview' ? `/reports/${route.view}` : '/reports';
        case 'segments':
            return '/segments';
        case 'workflows':
            return '/workflows';
        case 'settings':
            return '/settings';
        default:
            return '/';
    }
}

export function labHref(route: LabRoute): string {
    const path = routePath(route);

    if (isStandalone()) {
        return `#${path === '/' ? '/' : path}`;
    }

    return path === '/' ? '/design-lab' : `/design-lab${path}`;
}

function matchView(prefix: string, path: string): string {
    if (path === prefix) {
        return 'overview';
    }

    return path.slice(prefix.length + 1) || 'overview';
}

export function parseLabLocation(pathname: string, hash: string): LabRoute {
    const raw = pathname.startsWith('/design-lab')
        ? pathname.replace(/^\/design-lab/, '') || '/'
        : hash.replace(/^#/, '') || '/';
    const path = raw.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '') {
        return { name: 'accueil' };
    }

    if (path === '/tokens') {
        return { name: 'tokens' };
    }

    if (path === '/shell') {
        return { name: 'shell' };
    }

    if (path === '/components') {
        return { name: 'components' };
    }

    if (path === '/data') {
        return { name: 'data' };
    }

    if (path === '/inbox') {
        return { name: 'inbox' };
    }

    if (path === '/contacts') {
        return { name: 'contacts' };
    }

    const contact = path.match(/^\/contacts\/([^/]+)$/);

    if (contact?.[1]) {
        return { name: 'contact', id: contact[1] };
    }

    if (path === '/companies') {
        return { name: 'companies' };
    }

    const company = path.match(/^\/companies\/([^/]+)$/);

    if (company?.[1]) {
        return { name: 'company', id: company[1] };
    }

    if (path === '/leads') {
        return { name: 'leads' };
    }

    if (path === '/deals') {
        return { name: 'deals' };
    }

    const deal = path.match(/^\/deals\/([^/]+)$/);

    if (deal?.[1]) {
        return { name: 'deal', id: deal[1] };
    }

    if (path === '/quotes' || path === '/devis') {
        return { name: 'quotes' };
    }

    const quote = path.match(/^\/(?:quotes|devis)\/([^/]+)$/);

    if (quote?.[1]) {
        return { name: 'devis', id: quote[1] };
    }

    if (path === '/activities') {
        return { name: 'activities' };
    }

    if (path === '/outbound' || path.startsWith('/outbound/')) {
        return { name: 'outbound', view: matchView('/outbound', path) };
    }

    const campaign = path.match(/^\/ads\/campaigns\/([^/]+)$/);

    if (campaign?.[1]) {
        return { name: 'campaign', id: campaign[1] };
    }

    if (path === '/ads' || path === '/pubs' || path.startsWith('/ads/')) {
        return { name: 'ads', view: path === '/pubs' ? 'overview' : matchView('/ads', path) };
    }

    if (path === '/tickets') {
        return { name: 'tickets' };
    }

    if (path === '/reports' || path.startsWith('/reports/')) {
        return { name: 'reports', view: matchView('/reports', path) };
    }

    if (path === '/segments') {
        return { name: 'segments' };
    }

    if (path === '/workflows') {
        return { name: 'workflows' };
    }

    if (path === '/settings') {
        return { name: 'settings' };
    }

    return { name: 'accueil' };
}

export function navigateLab(route: LabRoute): void {
    const href = labHref(route);

    if (href.startsWith('#')) {
        window.location.hash = href.slice(1) || '/';

        return;
    }

    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export function roomOf(route: LabRoute): LabRoom {
    if (route.name === 'contact') {
        return 'contacts';
    }

    if (route.name === 'company') {
        return 'companies';
    }

    if (route.name === 'deal') {
        return 'deals';
    }

    if (route.name === 'devis') {
        return 'quotes';
    }

    if (route.name === 'campaign') {
        return 'ads';
    }

    return route.name;
}
