export type LabRoute =
    | { name: 'accueil' }
    | { name: 'ads' }
    | { name: 'contacts' }
    | { name: 'contact'; id: string }
    | { name: 'deal'; id: string }
    | { name: 'devis'; id: string }
    | { name: 'reports' };

function isStandalone(): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    return !window.location.pathname.startsWith('/design-lab');
}

export function labHref(route: LabRoute): string {
    const path =
        route.name === 'accueil'
            ? '/'
            : route.name === 'ads'
                ? '/ads'
                : route.name === 'contacts'
                    ? '/contacts'
                    : route.name === 'contact'
                        ? `/contacts/${route.id}`
                        : route.name === 'deal'
                            ? `/deals/${route.id}`
                            : route.name === 'devis'
                                ? `/devis/${route.id}`
                                : '/reports';

    if (isStandalone()) {
        return `#${path === '/' ? '/' : path}`;
    }

    return path === '/' ? '/design-lab' : `/design-lab${path}`;
}

export function parseLabLocation(pathname: string, hash: string): LabRoute {
    const raw = pathname.startsWith('/design-lab')
        ? pathname.replace(/^\/design-lab/, '') || '/'
        : hash.replace(/^#/, '') || '/';
    const path = raw.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '') {
        return { name: 'accueil' };
    }

    if (path === '/ads') {
        return { name: 'ads' };
    }

    if (path === '/contacts') {
        return { name: 'contacts' };
    }

    if (path === '/reports') {
        return { name: 'reports' };
    }

    const contact = path.match(/^\/contacts\/([^/]+)$/);

    if (contact?.[1]) {
        return { name: 'contact', id: contact[1] };
    }

    const deal = path.match(/^\/deals\/([^/]+)$/);

    if (deal?.[1]) {
        return { name: 'deal', id: deal[1] };
    }

    const devis = path.match(/^\/devis\/([^/]+)$/);

    if (devis?.[1]) {
        return { name: 'devis', id: devis[1] };
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
