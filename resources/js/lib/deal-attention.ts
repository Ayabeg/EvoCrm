export const DEAL_ATTENTION_TYPES = ['overdue_activity', 'no_next_action'] as const;

export type DealAttentionType = (typeof DEAL_ATTENTION_TYPES)[number];

export type DealAttentionSeverity = 'critical' | 'warning' | 'info';

export type DealAttentionSignal = {
    type: DealAttentionType;
    severity: DealAttentionSeverity;
    label: string;
    reason?: string;
    reason_replace?: Record<string, string | number>;
    at?: string | null;
    ref?: { type: 'activity'; id: number } | null;
};

export type DealAttentionPrimary = {
    type: DealAttentionType;
    severity: DealAttentionSeverity;
    label: string;
    reason?: string;
    reason_replace?: Record<string, string | number>;
};

export type DealAttention = {
    signals?: DealAttentionSignal[];
    primary: DealAttentionPrimary | null;
};

export type DealAttentionQueueItem = {
    id: number;
    title: string;
    href: string;
    primary: DealAttentionPrimary;
};

export function attentionToneClass(severity: DealAttentionSeverity | undefined): string {
    if (severity === 'critical') {
        return 'text-destructive';
    }

    if (severity === 'warning') {
        return 'text-ink';
    }

    return 'text-mute';
}
