/**
 * The only HTTP surface this client may call.
 * Source of truth: routes/api.php + docs/api-v1.md on current main.
 * Never invent endpoints. Missing product APIs stay backend handoffs.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type CatalogEntry = {
  method: HttpMethod;
  path: string;
  auth: boolean;
};

export const API_V1_ENDPOINTS = {
  authToken: { method: 'POST', path: '/auth/token', auth: false },
  revokeToken: { method: 'DELETE', path: '/auth/token', auth: true },
  me: { method: 'GET', path: '/me', auth: true },
  contactsIndex: { method: 'GET', path: '/contacts', auth: true },
  contactsStore: { method: 'POST', path: '/contacts', auth: true },
  contactsShow: { method: 'GET', path: '/contacts/{id}', auth: true },
  contactsUpdate: { method: 'PUT', path: '/contacts/{id}', auth: true },
  leadsBoard: { method: 'GET', path: '/leads/board', auth: true },
  leadsShow: { method: 'GET', path: '/leads/{id}', auth: true },
  leadsQualify: { method: 'POST', path: '/leads/{id}/qualify', auth: true },
  dealsShow: { method: 'GET', path: '/deals/{id}', auth: true },
  dealsMove: { method: 'POST', path: '/deals/{id}/move', auth: true },
  activitiesIndex: { method: 'GET', path: '/activities', auth: true },
  activitiesStore: { method: 'POST', path: '/activities', auth: true },
  quotesShow: { method: 'GET', path: '/quotes/{id}', auth: true },
  quotesSend: { method: 'POST', path: '/quotes/{id}/send', auth: true },
  threadsIndex: { method: 'GET', path: '/threads', auth: true },
  threadsReply: { method: 'POST', path: '/threads/{id}/reply', auth: true },
  devicesStore: { method: 'POST', path: '/devices', auth: true },
} as const satisfies Record<string, CatalogEntry>;

export type KnownEndpointName = keyof typeof API_V1_ENDPOINTS;

/** P0 gaps from PR #233 MOBILE-API-GAP-MATRIX. Do not call these. */
export const P0_API_BLOCKERS = {
  homeFeed: {
    method: 'GET',
    path: '/home',
    gap: 'G01',
    reason: 'Home attention feed is not on /api/v1. Wrap HomeDashboardBuilder on the backend first.',
  },
  dealsList: {
    method: 'GET',
    path: '/deals',
    gap: 'G02',
    reason: 'Deal show/move exist; paginated deals list does not.',
  },
  activityComplete: {
    method: 'POST',
    path: '/activities/{id}/complete',
    gap: 'G03',
    reason: 'Activities can be listed/created. Completing a task is not exposed.',
  },
  threadShow: {
    method: 'GET',
    path: '/threads/{id}',
    gap: 'G04',
    reason: 'Thread index/reply exist; thread+messages show does not.',
  },
} as const;

const TEMPLATE = /\{[^}]+\}/g;

export function catalogPathToRegex(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

export function isKnownEndpoint(method: string, path: string): boolean {
  return Object.values(API_V1_ENDPOINTS).some(
    (entry) => entry.method === method && catalogPathToRegex(entry.path).test(path),
  );
}

export function isBlockedEndpoint(method: string, path: string): boolean {
  return Object.values(P0_API_BLOCKERS).some(
    (entry) => entry.method === method && catalogPathToRegex(entry.path).test(path),
  );
}

export function expandPath(path: string, params: Record<string, string | number> = {}): string {
  return path.replace(TEMPLATE, (token) => {
    const key = token.slice(1, -1);
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing path param ${key} for ${path}`);
    }
    return encodeURIComponent(String(value));
  });
}

export function assertCallableEndpoint(method: HttpMethod, path: string): void {
  if (isBlockedEndpoint(method, path)) {
    throw new Error(
      `Blocked /api/v1 ${method} ${path}. This is a backend handoff — do not invent a client stub.`,
    );
  }
  if (!isKnownEndpoint(method, path)) {
    throw new Error(`Unknown /api/v1 endpoint: ${method} ${path}. Never invent routes.`);
  }
}
