export type QuoteItem = {
    id?: number;
    name: string;
    quantity: number;
    unit_cents: number;
    total_cents: number;
};

export type QuoteRecord = {
    id: number;
    title: string;
    status: string;
    status_label: string;
    currency: string;
    total_cents: number;
    notes?: string | null;
    created_at?: string | null;
    expires_at?: string | null;
    sent_at?: string | null;
    accepted_at?: string | null;
    revoked_at?: string | null;
    public_url?: string | null;
    immutable: boolean;
    owner?: { id: number; name: string } | null;
    deal?: { id: number; title: string } | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
    company?: { id: number; name: string } | null;
    items: QuoteItem[];
};
