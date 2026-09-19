/**
 * Non-sensitive preferences only (theme hint, last tab, etc.).
 * NEVER store Sanctum tokens, passwords, or push device tokens here.
 */
export type NonSensitiveStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
};

const FORBIDDEN = [/token/i, /password/i, /secret/i, /sanctum/i, /authorization/i];

export function assertNonSensitiveKey(key: string): void {
  if (FORBIDDEN.some((pattern) => pattern.test(key))) {
    throw new Error(`Refusing to write sensitive key "${key}" to non-secure storage.`);
  }
}

export function createMemoryPrefsStore(): NonSensitiveStore {
  const map = new Map<string, string>();
  return {
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      assertNonSensitiveKey(key);
      map.set(key, value);
    },
    async deleteItem(key) {
      map.delete(key);
    },
    async getAllKeys() {
      return [...map.keys()];
    },
  };
}
