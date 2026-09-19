import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createSecureCredentialStore, type SecureCredentialStore } from '@/lib/storage/secure';
import { assertNonSensitiveKey, type NonSensitiveStore } from '@/lib/storage/prefs';

export function createNativeSecureStore(): SecureCredentialStore {
  if (Platform.OS === 'web') {
    const memory = new Map<string, string>();
    return createSecureCredentialStore({
      async getItem(key) {
        return memory.get(key) ?? null;
      },
      async setItem(key, value) {
        memory.set(key, value);
      },
      async deleteItem(key) {
        memory.delete(key);
      },
    });
  }

  return createSecureCredentialStore({
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    deleteItem: (key) => SecureStore.deleteItemAsync(key),
  });
}

export function createNativePrefsStore(): NonSensitiveStore {
  return {
    getItem: (key) => AsyncStorage.getItem(key),
    async setItem(key, value) {
      assertNonSensitiveKey(key);
      await AsyncStorage.setItem(key, value);
    },
    deleteItem: (key) => AsyncStorage.removeItem(key),
    async getAllKeys() {
      return [...(await AsyncStorage.getAllKeys())];
    },
  };
}
