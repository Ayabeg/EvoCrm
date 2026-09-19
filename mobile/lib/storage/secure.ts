import { toSecureStoreKey } from '@/lib/storage/keys';

/**
 * Credential store. Tokens MUST go here — never AsyncStorage.
 * Native implementation: expo-secure-store (Keychain / Android Keystore).
 * Web / tests: injected memory backend. Web is not a production token target.
 */
export type SecureCredentialStore = {
  getItem(logicalKey: string): Promise<string | null>;
  setItem(logicalKey: string, value: string): Promise<void>;
  deleteItem(logicalKey: string): Promise<void>;
  clear(logicalKeys: string[]): Promise<void>;
};

export function createSecureCredentialStore(
  backend: {
    getItem: (physicalKey: string) => Promise<string | null>;
    setItem: (physicalKey: string, value: string) => Promise<void>;
    deleteItem: (physicalKey: string) => Promise<void>;
  },
): SecureCredentialStore {
  return {
    async getItem(logicalKey) {
      return backend.getItem(toSecureStoreKey(logicalKey));
    },
    async setItem(logicalKey, value) {
      await backend.setItem(toSecureStoreKey(logicalKey), value);
    },
    async deleteItem(logicalKey) {
      await backend.deleteItem(toSecureStoreKey(logicalKey));
    },
    async clear(logicalKeys) {
      await Promise.all(logicalKeys.map((key) => backend.deleteItem(toSecureStoreKey(key))));
    },
  };
}

export function createMemorySecureStore(): SecureCredentialStore {
  const map = new Map<string, string>();
  return createSecureCredentialStore({
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
    async deleteItem(key) {
      map.delete(key);
    },
  });
}
