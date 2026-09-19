export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export type AppEnvironmentName = (typeof APP_ENVIRONMENTS)[number];

export type AppEnvironment = {
  name: AppEnvironmentName;
  /** Public /api/v1 origin only. Never a Laravel or provider secret. */
  apiBaseUrl: string;
};

const PUBLIC_URLS = {
  development: process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1',
  staging: process.env.EXPO_PUBLIC_STAGING_API_URL ?? '',
  production: process.env.EXPO_PUBLIC_PRODUCTION_API_URL ?? '',
} as const;

export function resolveEnvironment(name: string | undefined): AppEnvironment {
  const env = APP_ENVIRONMENTS.includes(name as AppEnvironmentName)
    ? (name as AppEnvironmentName)
    : 'development';

  return {
    name: env,
    apiBaseUrl: normalizeApiBaseUrl(PUBLIC_URLS[env] || PUBLIC_URLS.development),
  };
}

export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('API base URL is empty. Set EXPO_PUBLIC_*_API_URL to a public /api/v1 origin.');
  }
  if (!trimmed.endsWith('/api/v1')) {
    throw new Error(`API base URL must end with /api/v1. Received: ${trimmed}`);
  }
  return trimmed;
}

export function currentEnvironment(): AppEnvironment {
  return resolveEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
}
