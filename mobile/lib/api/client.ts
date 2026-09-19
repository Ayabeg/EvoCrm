import {
  assertCallableEndpoint,
  expandPath,
  type HttpMethod,
  type KnownEndpointName,
  API_V1_ENDPOINTS,
} from '@/lib/api/catalog';
import {
  mapHttpError,
  offlineError,
  parseFailureError,
  timeoutError,
  type ApiError,
} from '@/lib/api/errors';

export const DEFAULT_TIMEOUT_MS = 15_000;

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => Promise<string | null> | string | null;
  isOnline?: () => Promise<boolean> | boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: ApiError;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type RequestInitWithoutAuth = {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async call<T>(
    name: KnownEndpointName,
    params: Record<string, string | number> = {},
    init: RequestInitWithoutAuth = {},
  ): Promise<ApiResult<T>> {
    const entry = API_V1_ENDPOINTS[name];
    const path = expandPath(entry.path, params);
    return this.request<T>(entry.method, path, { ...init, auth: entry.auth });
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    init: RequestInitWithoutAuth & { auth?: boolean } = {},
  ): Promise<ApiResult<T>> {
    assertCallableEndpoint(method, path);

    const online = this.options.isOnline ? await this.options.isOnline() : true;
    if (!online) {
      return { ok: false, error: offlineError() };
    }

    const url = this.buildUrl(path, init.query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...init.headers,
    };

    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (init.auth !== false) {
      const token = await this.options.getToken?.();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const fetchImpl = this.options.fetchImpl ?? fetch;

    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      });

      if (response.status === 204) {
        return { ok: true, status: 204, data: undefined as T };
      }

      const text = await response.text();
      const parsed = parseJsonBody(text);
      if (parsed === PARSE_FAILED) {
        return { ok: false, error: parseFailureError() };
      }

      if (!response.ok) {
        return { ok: false, error: mapHttpError(response.status, parsed) };
      }

      return { ok: true, status: response.status, data: parsed as T };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false, error: timeoutError() };
      }
      return { ok: false, error: parseFailureError() };
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const base = this.options.baseUrl.replace(/\/+$/, '');
    const suffix = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${suffix}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}

const PARSE_FAILED = Symbol('parse_failed');

function parseJsonBody(text: string): unknown {
  if (text.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return PARSE_FAILED;
  }
}
