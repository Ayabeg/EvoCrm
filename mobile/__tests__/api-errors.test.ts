import { kindForStatus, mapHttpError, parseLaravelErrorBody } from '@/lib/api/errors';
import { fixtures } from '@/testing/fixtures';

describe('API error mapping', () => {
  it('maps documented HTTP statuses', () => {
    expect(kindForStatus(401)).toBe('unauthorized');
    expect(kindForStatus(403)).toBe('forbidden');
    expect(kindForStatus(404)).toBe('not_found');
    expect(kindForStatus(422)).toBe('validation');
    expect(kindForStatus(429)).toBe('rate_limited');
    expect(kindForStatus(500)).toBe('server');
    expect(kindForStatus(503)).toBe('server');
  });

  it('parses Laravel { message, errors } bodies from fixtures', () => {
    expect(mapHttpError(401, fixtures.error401).message).toBe('Unauthenticated.');
    expect(mapHttpError(403, fixtures.error403Unverified).message).toBe('Email is not verified.');
    expect(mapHttpError(404, fixtures.error404).kind).toBe('not_found');
    expect(mapHttpError(429, fixtures.error429).kind).toBe('rate_limited');
    expect(mapHttpError(500, fixtures.error500).kind).toBe('server');

    const validation = mapHttpError(422, fixtures.error422);
    expect(validation.kind).toBe('validation');
    expect(validation.fieldErrors.email).toEqual(['The provided credentials are incorrect.']);
  });

  it('ignores malformed error payloads', () => {
    expect(parseLaravelErrorBody('nope')).toEqual({ message: '', fieldErrors: {} });
    expect(parseLaravelErrorBody({ errors: { email: 'x' } }).fieldErrors).toEqual({});
  });
});
