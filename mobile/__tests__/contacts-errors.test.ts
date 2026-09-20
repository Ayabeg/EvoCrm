import { contactErrorMessage } from '@/features/contacts/errors';
import type { ApiError } from '@/lib/api/errors';

function err(kind: ApiError['kind'], message = ''): ApiError {
  return { kind, status: null, message, fieldErrors: {} };
}

describe('contactErrorMessage', () => {
  it('maps 401/403/404/offline/5xx without raw internals', () => {
    expect(contactErrorMessage(err('unauthorized'))).toMatch(/session expired/i);
    expect(contactErrorMessage(err('forbidden', 'write'), 'write')).toMatch(/permission/i);
    expect(contactErrorMessage(err('not_found'))).toMatch(/not found/i);
    expect(contactErrorMessage(err('offline'))).toMatch(/offline/i);
    expect(contactErrorMessage(err('server', 'SQLSTATE[…]'))).toMatch(/server encountered/i);
    expect(contactErrorMessage(err('server', 'SQLSTATE[…]')).includes('SQLSTATE')).toBe(false);
  });
});
