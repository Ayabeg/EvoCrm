import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import {
  assertNoCrossWorkspaceLeak,
  clearWorkspaceState,
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
    assertNoCrossWorkspaceLeak(await store.getAllKeys(), 1);

    await clearWorkspaceState(store, 1);
    expect(await readWorkspaceCache(store, 1, 'contacts')).toBeNull();
    expect(await readWorkspaceCache(store, 2, 'contacts')).toBe('b');
  });
});
