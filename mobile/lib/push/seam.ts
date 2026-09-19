import type { ApiClient } from '@/lib/api/client';
import type { DeviceResponse } from '@/types/api';

/**
 * Push seam only. Backend DeviceController upsert is authoritative.
 * This client never sends notifications and does not invent a dispatch pipeline.
 */
export type DevicePlatform = 'ios' | 'android';
export type DeviceProvider = 'apns' | 'fcm';

export type DeviceRegistrationInput = {
  platform: DevicePlatform;
  token: string;
  provider?: DeviceProvider;
};

export async function registerDevice(
  client: ApiClient,
  input: DeviceRegistrationInput,
): Promise<DeviceResponse> {
  const result = await client.call<DeviceResponse>('devicesStore', {}, { body: input });
  if (!result.ok) {
    throw result.error;
  }
  return result.data;
}

export function defaultProvider(platform: DevicePlatform): DeviceProvider {
  return platform === 'ios' ? 'apns' : 'fcm';
}
