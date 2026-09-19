import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import {
  assertNoCrossWorkspaceLeak,
  belongsToWorkspace,
  clearWorkspaceState,
  parseWorkspaceKey,
  readWorkspaceCache,
  workspaceKey,
  writeWorkspaceCache,
} from '@/lib/workspace/isolation';

describe('workspace isolation', () => {
  it('uses ws:{workspaceId}: keys', () => {
    expect(workspaceKey(12, 'contacts')).toBe('ws:12:contacts');
  });

  it('never mixes workspace A and B caches', async () => {
    const store = createMemoryPrefsStore();
    await writeWorkspaceCache(store, 1, 'contacts', 'a');
    await writeWorkspaceCache(store, 2, 'contacts', 'b');

    expect(await readWorkspaceCache(store, 1, 'contacts')).toBe('a');
    expect(await readWorkspaceCache(store, 2, 'contacts')).toBe('b');

    const keysForOne = (await store.getAllKeys()).filter((key) => belongsToWorkspace(key, 1));
    expect(keysForOne).toEqual(['ws:1:contacts']);
    expect(keysForOne.every((key) => parseWorkspaceKey(key)?.workspaceId === '1')).toBe(true);

    await clearWorkspaceState(store, 1);
    expect(await readWorkspaceCache(store, 1, 'contacts')).toBeNull();
    expect(await readWorkspaceCache(store, 2, 'contacts')).toBe('b');
  });

  it('rejects a mixed payload handed to one workspace', () => {
    expect(() => assertNoCrossWorkspaceLeak(['ws:1:contacts', 'ws:2:contacts'], 1)).toThrow(
      /Workspace cache leak/,
    );
  });
});
