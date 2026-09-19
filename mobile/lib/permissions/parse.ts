/**
 * Server is the permission engine. The client only parses the /me array
 * for UI hints. Never invent capabilities or re-implement G4 policies.
 */

export const KNOWN_PERMISSIONS = ['crm.view', 'crm.edit', 'desk.manage'] as const;

export type KnownPermission = (typeof KNOWN_PERMISSIONS)[number];

export function parsePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function hasServerPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canHint(permissions: string[], permission: KnownPermission): boolean {
  return hasServerPermission(permissions, permission);
}
