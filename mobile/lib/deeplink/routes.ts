/**
 * Deep-link surface only. Routes exist so incoming URLs resolve.
 * Screens must not invent records. Missing APIs stay honest blockers.
 */

export const DEEP_LINK_OBJECTS = [
  'contact',
  'company',
  'lead',
  'deal',
  'activity',
  'thread',
  'quote',
] as const;

export type DeepLinkObject = (typeof DEEP_LINK_OBJECTS)[number];

export type DeepLinkRoute = {
  object: DeepLinkObject;
  id: string;
  href: `/${DeepLinkObject}/${string}`;
  /** Documented GET that can hydrate this screen, or null if backend-blocked. */
  showEndpoint: { method: 'GET'; path: string } | null;
  blocker: string | null;
};

const SHOW: Record<DeepLinkObject, DeepLinkRoute['showEndpoint']> = {
  contact: { method: 'GET', path: '/contacts/{id}' },
  company: null,
  lead: { method: 'GET', path: '/leads/{id}' },
  deal: { method: 'GET', path: '/deals/{id}' },
  activity: null,
  thread: null,
  quote: { method: 'GET', path: '/quotes/{id}' },
};

const BLOCKERS: Record<DeepLinkObject, string | null> = {
  contact: null,
  company: 'GET /api/v1/companies/{id} is not in v1. Company records stay a backend handoff.',
  lead: null,
  deal: null,
  activity: 'GET /api/v1/activities/{id} is not in v1. Queue uses GET /activities.',
  thread: 'GET /api/v1/threads/{id} is P0 blocker G04.',
  quote: null,
};

export function parseDeepLink(url: string): DeepLinkRoute | null {
  let path: string;
  try {
    const parsed = new URL(url);
    path = parsed.pathname || parsed.host + parsed.pathname;
    if (parsed.protocol === 'evocrm:') {
      path = `/${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
    }
  } catch {
    path = url;
  }

  const match = /^\/?(contact|company|lead|deal|activity|thread|quote)\/([^/?#]+)/.exec(path);
  if (!match) {
    return null;
  }

  const object = match[1] as DeepLinkObject;
  const id = decodeURIComponent(match[2]);
  return {
    object,
    id,
    href: `/${object}/${id}`,
    showEndpoint: SHOW[object],
    blocker: BLOCKERS[object],
  };
}

export function buildDeepLink(object: DeepLinkObject, id: string | number): string {
  return `evocrm://${object}/${id}`;
}
