import { belongsToWorkspace, parseWorkspaceKey, workspaceKey } from '@/lib/storage/keys';
import type { NonSensitiveStore } from '@/lib/storage/prefs';

export { belongsToWorkspace, parseWorkspaceKey, workspaceKey };

export async function writeWorkspaceCache(
  store: NonSensitiveStore,
  workspaceId: string | number,
  suffix: string,
  value: string,
): Promise<void> {
  await store.setItem(workspaceKey(workspaceId, suffix), value);
}

export async function readWorkspaceCache(
  store: NonSensitiveStore,
  workspaceId: string | number,
  suffix: string,
): Promise<string | null> {
  return store.getItem(workspaceKey(workspaceId, suffix));
}

export async function clearWorkspaceState(
  store: NonSensitiveStore,
  workspaceId: string | number,
): Promise<void> {
  const keys = await store.getAllKeys();
  await Promise.all(
    keys.filter((key) => belongsToWorkspace(key, workspaceId)).map((key) => store.deleteItem(key)),
  );
}

export async function clearAllWorkspaceState(store: NonSensitiveStore): Promise<void> {
  const keys = await store.getAllKeys();
  await Promise.all(
    keys.filter((key) => parseWorkspaceKey(key) !== null).map((key) => store.deleteItem(key)),
  );
}

export function assertNoCrossWorkspaceLeak(
  keys: string[],
  workspaceId: string | number,
): void {
  const foreign = keys.filter((key) => {
    const parsed = parseWorkspaceKey(key);
    return parsed !== null && !belongsToWorkspace(key, workspaceId);
  });
  if (foreign.length > 0) {
    throw new Error(`Workspace cache leak: ${foreign.join(', ')}`);
  }
}
