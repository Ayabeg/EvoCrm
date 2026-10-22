export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type User = {
    id: number;
    name: string;
    email: string;
    role: WorkspaceRole;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Workspace = {
    id: number;
    name: string;
    slug: string;
    timezone?: string;
    [key: string]: unknown;
};

export type PosthogShared = {
    enabled: boolean;
    key: string | null;
    host: string;
    distinct_id: string | null;
    identify_pii?: boolean;
};

export type Auth = {
    user: User;
    capabilities: string[];
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
