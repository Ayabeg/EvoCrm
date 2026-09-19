import {
  API_V1_ENDPOINTS,
  P0_API_BLOCKERS,
  assertCallableEndpoint,
  isBlockedEndpoint,
  isKnownEndpoint,
} from '@/lib/api/catalog';

describe('API catalog', () => {
  it('only lists documented /api/v1 routes', () => {
    const paths = Object.values(API_V1_ENDPOINTS).map((entry) => `${entry.method} ${entry.path}`);
    expect(paths).toEqual([
      'POST /auth/token',
      'DELETE /auth/token',
      'GET /me',
      'GET /contacts',
      'POST /contacts',
      'GET /contacts/{id}',
      'PUT /contacts/{id}',
      'GET /leads/board',
      'GET /leads/{id}',
      'POST /leads/{id}/qualify',
      'GET /deals/{id}',
      'POST /deals/{id}/move',
      'GET /activities',
      'POST /activities',
      'GET /quotes/{id}',
      'POST /quotes/{id}/send',
      'GET /threads',
      'POST /threads/{id}/reply',
      'POST /devices',
    ]);
  });

  it('accepts parameterized known routes', () => {
    expect(isKnownEndpoint('GET', '/contacts/12')).toBe(true);
    expect(isKnownEndpoint('POST', '/deals/44/move')).toBe(true);
  });

  it('rejects invented routes', () => {
    expect(isKnownEndpoint('GET', '/home')).toBe(false);
    expect(isKnownEndpoint('GET', '/deals')).toBe(false);
    expect(() => assertCallableEndpoint('GET', '/search')).toThrow(/Never invent routes/);
  });

  it('blocks P0 backend handoffs instead of stubbing them', () => {
    expect(isBlockedEndpoint('GET', '/home')).toBe(true);
    expect(isBlockedEndpoint('GET', '/deals')).toBe(true);
    expect(isBlockedEndpoint('POST', '/activities/9/complete')).toBe(true);
    expect(isBlockedEndpoint('GET', '/threads/18')).toBe(true);
    expect(() => assertCallableEndpoint('GET', '/home')).toThrow(/backend handoff/);
    expect(P0_API_BLOCKERS.threadShow.gap).toBe('G04');
  });
});
