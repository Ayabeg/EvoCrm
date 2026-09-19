import { ApiClient } from '@/lib/api/client';
import { emptyResponse, fixtures, jsonResponse } from '@/testing/fixtures';

function client(fetchImpl: typeof fetch, extras: { online?: boolean } = {}) {
  return new ApiClient({
    baseUrl: 'https://example.test/api/v1',
    fetchImpl,
    isOnline: () => extras.online ?? true,
    getToken: () => '1|fixture-token-not-a-secret',
    timeoutMs: 50,
  });
}

describe('API client', () => {
  it('reads /me against the success fixture', async () => {
    const api = client(async () => jsonResponse(200, fixtures.meSuccess));
    const result = await api.call('me');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(fixtures.meSuccess);
    }
  });

  it('maps 401 from fixture', async () => {
    const api = client(async () => jsonResponse(401, fixtures.error401));
    const result = await api.call('me');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unauthorized');
    }
  });

  it('treats 204 revoke as success', async () => {
    const api = client(async () => emptyResponse(204));
    const result = await api.call('revokeToken');
    expect(result.ok).toBe(true);
  });

  it('returns offline without hitting the network', async () => {
    const fetchImpl = jest.fn();
    const api = client(fetchImpl as unknown as typeof fetch, { online: false });
    const result = await api.call('me');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('offline');
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns timeout when the request is aborted', async () => {
    const api = client(
      () =>
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        }),
    );
    const result = await api.call('me');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('timeout');
    }
  });

  it('returns parse_failure on HTML bodies', async () => {
    const api = client(async () => new Response('<html>nope</html>', { status: 200 }));
    const result = await api.call('me');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('parse_failure');
    }
  });

  it('refuses invented endpoints before fetch', async () => {
    const fetchImpl = jest.fn();
    const api = client(fetchImpl as unknown as typeof fetch);
    await expect(api.request('GET', '/home')).rejects.toThrow(/backend handoff/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
