/** Shapes documented in docs/api-v1.md and App\Http\Controllers\Api\V1\Support\ApiPayload. */

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: string | null;
};

export type ApiWorkspace = {
  id: number;
  name: string;
  slug: string;
  timezone: string;
};

export type AuthTokenResponse = {
  data: {
    token: string;
    token_type: 'Bearer';
    user: ApiUser;
    workspace: ApiWorkspace | null;
  };
};

export type MeResponse = {
  data: {
    user: ApiUser;
    workspace: ApiWorkspace;
    permissions: string[];
  };
};

export type DeviceResponse = {
  data: {
    id: number;
    platform: 'ios' | 'android';
    provider: 'apns' | 'fcm';
    last_seen_at: string | null;
  };
};

export type LaravelValidationError = {
  message: string;
  errors: Record<string, string[]>;
};

export type LaravelMessageError = {
  message: string;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};
