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
