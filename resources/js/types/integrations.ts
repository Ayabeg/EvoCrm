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
    provider: 'whatsapp_cloud' | 'instagram' | 'facebook_messenger';
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
};

export type MarketplaceApp = {
    key: string;
    name: string;
    tagline: string;
    connected: boolean;
    configured: boolean;
    connected_at: string | null;
    connect_url: string | null;
    manage_url: string | null;
    callback_url?: string;
    webmail_url?: string | null;
    mailboxes?: number;
    unlocks: AppUnlock[];
};
