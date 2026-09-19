/** Logical keys. SecureStore only allows [A-Za-z0-9._-], so physical keys are sanitized. */

export const SECURE_TOKEN_KEY = 'auth.sanctum_token';
export const SECURE_SESSION_KEY = 'auth.session_meta';

export function workspaceKey(workspaceId: string | number, suffix: string): string {
  if (suffix.includes(':') || suffix.includes('/')) {
    throw new Error('Workspace suffix must not contain ":" or "/".');
  }
  return `ws:${workspaceId}:${suffix}`;
}

export function parseWorkspaceKey(key: string): { workspaceId: string; suffix: string } | null {
  const match = /^ws:([^:]+):(.+)$/.exec(key);
  if (!match) {
    return null;
  }
  return { workspaceId: match[1], suffix: match[2] };
}

export function belongsToWorkspace(key: string, workspaceId: string | number): boolean {
  return key.startsWith(`ws:${workspaceId}:`);
}

export function toSecureStoreKey(logicalKey: string): string {
  return logicalKey.replace(/[^A-Za-z0-9._-]/g, '_');
}
