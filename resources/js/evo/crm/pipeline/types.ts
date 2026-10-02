export type PipelineKind = 'deal' | 'ticket';

export type PipelineColumnData = {
    id: string;
    name: string;
    slug?: string;
    count: number;
    amount?: string;
    weighted?: string;
    probability?: number;
    accent: string;
    isLost?: boolean;
    isWon?: boolean;
};

export type PipelineDealCard = {
    id: number;
    title: string;
    amount: string;
    association?: string | null;
    owner?: string | null;
    href: string;
    attention?: string | null;
    attentionType?: string | null;
    attentionSeverity?: string | null;
    nextActivity?: string | null;
    quotes?: string | null;
    inactive?: string | null;
    closeDate?: string | null;
    priority?: 'high' | 'low' | null;
    compact?: boolean;
};

export type PipelineTicketCard = {
    id: number;
    subject: string;
    number: string;
    association?: string | null;
    owner?: string | null;
    href: string;
    priority?: 'high' | 'medium' | 'low' | null;
    sla?: string | null;
    sla_label?: string | null;
    slaBreached?: boolean;
    inactive?: string | null;
};

export type ForecastTotals = {
    count: number;
    amount: string;
    weighted: string;
    open?: string;
    band?: string | null;
    narrative?: string | null;
};

export type LostReasonPending = {
    itemId: string;
    columnId: string;
    title: string;
};
