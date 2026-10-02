export type QuoteLine = {
    id?: string | number;
    name: string;
    quantity: number;
    unitDzd: number;
};

export type QuoteTotalsValue = {
    subtotalDzd: number;
    taxDzd?: number;
    totalDzd: number;
};

export type QuoteLifecycleStatus =
    'draft' | 'sent' | 'accepted' | 'revoked' | 'expired';

export type QuoteWorkspaceRecord = {
    id: number;
    title: string;
    number?: string;
    status: QuoteLifecycleStatus;
    statusLabel: string;
    contactName?: string | null;
    companyName?: string | null;
    ownerName?: string | null;
    expiresAt?: string | null;
    notes?: string | null;
    items: QuoteLine[];
    totals: QuoteTotalsValue;
    previewHref?: string;
    immutable?: boolean;
};
