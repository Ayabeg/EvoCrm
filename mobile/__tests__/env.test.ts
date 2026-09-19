import { normalizeApiBaseUrl, resolveEnvironment } from '@/config/environments';

describe('environments', () => {
  it('requires a public /api/v1 base URL', () => {
    expect(normalizeApiBaseUrl('https://app.example.com/api/v1/')).toBe('https://app.example.com/api/v1');
    expect(() => normalizeApiBaseUrl('https://app.example.com')).toThrow(/\/api\/v1/);
  });

  it('defaults unknown names to development', () => {
    expect(resolveEnvironment('nope').name).toBe('development');
    expect(resolveEnvironment('staging').name).toBe('staging');
    expect(resolveEnvironment('production').name).toBe('production');
  });
});
