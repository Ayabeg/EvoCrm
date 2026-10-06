import type {
    WorkspaceArchetype,
    WorkspaceRouteResolution,
    WorkspaceScrollOwner,
    WorkspaceShellScroll,
} from '@/evo/workspace/types';

const GREETING_RE =
    /^(hello|bonjour|bonsoir|salut|welcome|bienvenue|مرحبا|أهلا)\b/i;

export function pathnameFromUrl(url: string): string {
    const path = (url.split('?')[0] ?? '/').split('#')[0] ?? '/';

    return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

export function isGreetingTitle(title: string): boolean {
    return GREETING_RE.test(title.trim());
}

export function countPrimaryActions(primaryAction: unknown): 0 | 1 {
    return primaryAction == null || primaryAction === false ? 0 : 1;
}

function isNumericSegment(value: string): boolean {
    return /^\d+$/.test(value);
}

function resolveAcceptance(path: string): Omit<
    WorkspaceRouteResolution,
    'path'
> | null {
    if (path === '/dashboard') {
        return {
            archetype: 'document',
            scrollOwner: 'document',
            migrated: true,
            shellScroll: 'frame',
        };
    }

    if (path === '/inbox' || path.startsWith('/inbox/')) {
        return {
            archetype: 'conversation',
            scrollOwner: 'conversation',
            migrated: true,
            shellScroll: 'frame',
        };
    }

    if (path === '/settings' || path.startsWith('/settings/')) {
        return {
            archetype: 'document',
            scrollOwner: 'document',
            migrated: true,
            shellScroll: 'frame',
        };
    }

    if (path === '/crm/contacts') {
        return workspaceSurface();
    }

    if (path === '/crm/deals') {
        return workspaceSurface();
    }

    if (path === '/crm/deals/board') {
        return {
            archetype: 'workspace',
            scrollOwner: 'pipeline',
            migrated: true,
            shellScroll: 'frame',
        };
    }

    if (path === '/crm/quotes') {
        return workspaceSurface();
    }

    const contact = matchRecord(path, '/crm/contacts/', [
        'import',
        'duplicates',
        'merge',
    ]);
    if (contact) {
        return recordColumns();
    }

    const company = matchRecord(path, '/crm/companies/', []);
    if (company) {
        return recordColumns();
    }

    const lead = matchRecord(path, '/crm/leads/', ['captures']);
    if (lead) {
        return recordColumns();
    }

    if (matchRecord(path, '/crm/quotes/', [])) {
        return {
            archetype: 'document',
            scrollOwner: 'document',
            migrated: true,
            shellScroll: 'frame',
        };
    }

    return null;
}

function workspaceSurface(): Omit<WorkspaceRouteResolution, 'path'> {
    return {
        archetype: 'workspace',
        scrollOwner: 'surface',
        migrated: true,
        shellScroll: 'frame',
    };
}

function recordColumns(): Omit<WorkspaceRouteResolution, 'path'> {
    return {
        archetype: 'record',
        scrollOwner: 'columns',
        migrated: true,
        shellScroll: 'frame',
    };
}

function matchRecord(
    path: string,
    prefix: string,
    reserved: string[],
): boolean {
    if (!path.startsWith(prefix)) {
        return false;
    }

    const rest = path.slice(prefix.length);
    const [head] = rest.split('/');

    if (!head || reserved.includes(head)) {
        return false;
    }

    return isNumericSegment(head) || rest.length > 0;
}

export function resolveWorkspaceRoute(url: string): WorkspaceRouteResolution {
    const path = pathnameFromUrl(url);
    const accepted = resolveAcceptance(path);

    if (accepted) {
        return { path, ...accepted };
    }

    return {
        path,
        archetype: inferUnmigratedArchetype(path),
        scrollOwner: 'document',
        migrated: false,
        shellScroll: 'document',
    };
}

function inferUnmigratedArchetype(path: string): WorkspaceArchetype {
    if (path === '/inbox' || path.startsWith('/inbox/')) {
        return 'conversation';
    }

    if (
        /\/crm\/(contacts|companies|leads|deals|tickets)\/\d+/.test(path)
    ) {
        return 'record';
    }

    if (
        path.startsWith('/crm/') &&
        !path.includes('/import') &&
        !/\/\d+$/.test(path)
    ) {
        return 'workspace';
    }

    return 'document';
}

export function frameOwnsScroll(resolution: WorkspaceRouteResolution): boolean {
    return resolution.migrated && resolution.shellScroll === 'frame';
}

export function documentScrolls(
    owner: WorkspaceScrollOwner,
): boolean {
    return owner === 'document';
}

export const ACCEPTANCE_PATHS = [
    '/dashboard',
    '/crm/contacts',
    '/crm/deals',
    '/crm/deals/board',
    '/crm/contacts/{id}',
    '/crm/companies/{id}',
    '/crm/leads/{id}',
    '/inbox',
    '/crm/quotes',
    '/crm/quotes/{id}',
    '/settings',
] as const;
