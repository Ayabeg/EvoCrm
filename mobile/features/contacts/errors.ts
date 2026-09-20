import type { ApiError } from '@/lib/api/errors';

/**
 * User-facing contact error copy. Never expose stack traces or Laravel internals.
 * 401 is handled by M07 session expiry — screens should not invent a second logout path.
 */
export function contactErrorMessage(error: ApiError, context: 'list' | 'show' | 'write' = 'list'): string {
  switch (error.kind) {
    case 'unauthorized':
      return 'Your session expired. Sign in again.';
    case 'forbidden':
      return context === 'write'
        ? 'You do not have permission to change contacts.'
        : 'You do not have permission to view contacts.';
    case 'not_found':
      return 'This contact was not found in this workspace.';
    case 'validation':
      return error.message || 'Please fix the highlighted fields.';
    case 'offline':
      return error.message || 'You appear to be offline.';
    case 'timeout':
      return 'The request timed out. Try again.';
    case 'rate_limited':
      return 'Too many requests. Try again shortly.';
    case 'server':
      return 'The server encountered an error. Try again.';
    case 'parse_failure':
      return 'The server returned an unexpected response.';
    default:
      return error.message || 'Something went wrong.';
  }
}
