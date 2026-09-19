import { Platform } from 'react-native';
import * as Network from 'expo-network';

import { currentEnvironment } from '@/config/environments';
import { ApiClient } from '@/lib/api/client';
import { createNativePrefsStore, createNativeSecureStore } from '@/lib/storage/native';
import { AuthService } from '@/lib/auth/session';

export const secureStore = createNativeSecureStore();
export const prefsStore = createNativePrefsStore();

export const apiClient = new ApiClient({
  baseUrl: currentEnvironment().apiBaseUrl,
  getToken: () => secureStore.getItem('auth.sanctum_token'),
  async isOnline() {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    const state = await Network.getNetworkStateAsync();
    return state.isConnected !== false && state.isInternetReachable !== false;
  },
});

export const authService = new AuthService({
  client: apiClient,
  secure: secureStore,
  prefs: prefsStore,
  deviceName: Platform.OS === 'ios' ? 'EvoCRM iOS' : Platform.OS === 'android' ? 'EvoCRM Android' : 'EvoCRM Web',
});
