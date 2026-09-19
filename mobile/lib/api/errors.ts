export const API_ERROR_KINDS = [
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'rate_limited',
  'server',
  'timeout',
  'offline',
  'parse_failure',
  'unknown',
] as const;

export type ApiErrorKind = (typeof API_ERROR_KINDS)[number];

export type ApiError = {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
  fieldErrors: Record<string, string[]>;
};

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  422: 'validation',
  429: 'rate_limited',
};

export function kindForStatus(status: number): ApiErrorKind {
  if (KIND_BY_STATUS[status]) {
    return KIND_BY_STATUS[status];
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

export function mapHttpError(status: number, body: unknown): ApiError {
  const parsed = parseLaravelErrorBody(body);
  return {
    kind: kindForStatus(status),
    status,
    message: parsed.message || defaultMessage(kindForStatus(status)),
    fieldErrors: parsed.fieldErrors,
  };
}

export function timeoutError(): ApiError {
  return {
    kind: 'timeout',
    status: null,
    message: 'The request timed out.',
    fieldErrors: {},
  };
}

export function offlineError(): ApiError {
  return {
    kind: 'offline',
    status: null,
    message: 'The device is offline.',
    fieldErrors: {},
  };
}

export function parseFailureError(): ApiError {
  return {
    kind: 'parse_failure',
    status: null,
    message: 'The server returned a response that could not be parsed.',
    fieldErrors: {},
  };
}

export function parseLaravelErrorBody(body: unknown): {
  message: string;
  fieldErrors: Record<string, string[]>;
} {
  if (!body || typeof body !== 'object') {
    return { message: '', fieldErrors: {} };
  }

  const record = body as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message : '';
  const fieldErrors: Record<string, string[]> = {};

  if (record.errors && typeof record.errors === 'object' && record.errors !== null) {
    for (const [field, messages] of Object.entries(record.errors as Record<string, unknown>)) {
      if (Array.isArray(messages) && messages.every((item) => typeof item === 'string')) {
        fieldErrors[field] = messages;
      }
    }
  }

  return { message, fieldErrors };
}

function defaultMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case 'unauthorized':
      return 'Authentication is required.';
    case 'forbidden':
      return 'You do not have permission to do this.';
    case 'not_found':
      return 'The record was not found in this workspace.';
    case 'validation':
      return 'The request failed validation.';
    case 'rate_limited':
      return 'Too many requests. Try again shortly.';
    case 'server':
      return 'The server encountered an error.';
    default:
      return 'The request failed.';
  }
}

export function isApiError(value: unknown): value is ApiError {
  return (
    !!value &&
    typeof value === 'object' &&
    'kind' in value &&
    API_ERROR_KINDS.includes((value as ApiError).kind)
  );
}
