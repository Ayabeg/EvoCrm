import type { AuthSession } from '@/types/auth';
import { parsePermissions } from '@/lib/permissions/parse';
import {
  IDENTITY_CACHE_SUFFIX,
  LAST_WORKSPACE_PREF_KEY,
  workspaceKey,
} from '@/lib/storage/keys';
import type { NonSensitiveStore } from '@/lib/storage/prefs';
import { clearAllWorkspaceState, clearWorkspaceState, writeWorkspaceCache } from '@/lib/workspace/isolation';

type IdentitySnapshot = Pick<AuthSession, 'user' | 'workspace' | 'permissions'>;

export async function persistIdentitySnapshot(
  prefs: NonSensitiveStore,
  session: AuthSession,
): Promise<void> {
  if (!session.workspace || !session.user) {
    return;
  }

  const nextId = session.workspace.id;
  const previousId = await prefs.getItem(LAST_WORKSPACE_PREF_KEY);
  if (previousId && previousId !== String(nextId)) {
    await clearWorkspaceState(prefs, previousId);
  }

  await writeWorkspaceCache(
    prefs,
    nextId,
    IDENTITY_CACHE_SUFFIX,
    JSON.stringify({
      user: session.user,
      workspace: session.workspace,
      permissions: session.permissions,
    } satisfies IdentitySnapshot),
  );
  await prefs.setItem(LAST_WORKSPACE_PREF_KEY, String(nextId));
}

export async function readIdentitySnapshot(prefs: NonSensitiveStore): Promise<AuthSession | null> {
  const workspaceId = await prefs.getItem(LAST_WORKSPACE_PREF_KEY);
  if (!workspaceId) {
    return null;
  }

  const raw = await prefs.getItem(workspaceKey(workspaceId, IDENTITY_CACHE_SUFFIX));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as IdentitySnapshot;
    if (!parsed.user || !parsed.workspace) {
      return null;
    }
    return {
      status: 'authenticated',
      user: parsed.user,
      workspace: parsed.workspace,
      permissions: parsePermissions(parsed.permissions),
    };
  } catch {
    return null;
  }
}

export async function clearIdentityAndWorkspaceState(prefs: NonSensitiveStore): Promise<void> {
  await clearAllWorkspaceState(prefs);
  await prefs.deleteItem(LAST_WORKSPACE_PREF_KEY);
}
