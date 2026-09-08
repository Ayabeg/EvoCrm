export type SharedIntegrations = {
    meta: {
        configured: boolean;
        connected: boolean;
        scopes: string[];
    };
    google: {
        connected: boolean;
    };
    smtp: {
        connected: boolean;
    };
};

export type AppUnlock = {
    key: string;
    label: string;
    scope: string;
    granted: boolean;
};

export type ConnectorStatus =
    | 'not_connected'
    | 'needs_token'
    | 'needs_reconnect'
    | 'connected';

export type OfficialDeskConnector = {
    provider: 'whatsapp' | 'whatsapp_cloud' | 'instagram' | 'facebook_messenger';
    name: string;
    tagline: string;
    intent: string;
    status: ConnectorStatus;
    connected_at: string | null;
    reason: string | null;
};

export type GoogleWorkspaceConnector = {
    provider: 'gmail' | 'google_calendar';
    name: string;
    tagline: string;
    intent: string;
    status: ConnectorStatus;
    connected_at: string | null;
    reason: string | null;
    scopes_on_client: boolean;
    reconnect_url: string | null;
    sync?: {
        status: 'idle' | 'running' | 'paused' | 'error';
        cursor?: string | null;
        last_synced_at?: string | null;
        last_error?: string | null;
        has_token?: boolean;
    };
};

export type MarketplaceApp = {
    key: string;
    name: string;
    tagline: string;
    connected: boolean;
    configured: boolean;
    connected_at: string | null;
    connect_url: string | null;
    instagram_connect_url?: string | null;
    setup_url?: string | null;
    manage_url: string | null;
    callback_url?: string;
    origin_url?: string;
    instagram_callback_url?: string;
    popup?: boolean;
    instagram_connected?: boolean;
    facebook_connected?: boolean;
    webmail_url?: string | null;
    mailboxes?: number;
    unlocks: AppUnlock[];
};
