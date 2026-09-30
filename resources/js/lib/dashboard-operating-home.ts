import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import type { RecordRef } from '@/ds/workspace/quick-record/types';
import { activityQueueHref } from '@/lib/activity-work-queue';
import type { ActivityQueueGroup, ActivityQueueItem } from '@/lib/activity-work-queue';
import type { DealAttentionQueueItem } from '@/lib/deal-attention';

export const DASHBOARD_TIMEZONE = 'Africa/Algiers';

/** Strongest Home exceptions. Full queue stays behind View all. P17 payload unchanged. */
export const HOME_ATTENTION_VISIBLE = 4;

/** 2×2 through 768; 4-col from lg (1024). Typographic columns, not spreadsheet cells. */
export const HOME_KPI_STRIP_TRACK_CLASS =
    'grid grid-cols-2 gap-3 lg:grid-cols-4';

/** Compact values may wrap. Approved home snapshot is 25/30. */
export const HOME_KPI_VALUE_CLASS =
    'money min-w-0 max-w-full text-[25px] leading-[30px] font-semibold tracking-tight break-words text-[var(--home-ink)]';


export type DashboardContext = {
    name: string;
    date: string;
    timezone: string;
};

export type DashboardTrendPoint = {
    label: string;
    won_cents: number;
    created_cents: number;
};

export type DashboardRecentDeal = {
    id: number;
    title: string;
    company: string | null;
    stage: string | null;
    amount_cents: number;
    created_at: string | null;
    href: string;
};

export type DashboardMetrics = {
    window: {
        from: string;
        to: string;
        label: string;
        timezone: string;
    };
    kpis: KpiTile[];
    trend?: DashboardTrendPoint[];
};

export type DashboardAttention = {
    items: DealAttentionQueueItem[];
    view_all_href: string;
};

export type DashboardWork = {
    counts: {
        overdue: number;
        today: number;
        upcoming: number;
    };
    items: ActivityQueueItem[];
    view_all_href: string;
    overdue_href: string;
    today_href: string;
    upcoming_href: string;
};

export type DashboardPipelineStage = {
    id: number;
    name: string;
    slug: string;
    count: number;
    amount_cents: number;
    href: string;
};

export type DashboardPipeline = {
    pipeline_id: number;
    label: string;
    deal_count: number;
    amount_cents: number;
    currency: string;
    weighted: boolean;
    stages: DashboardPipelineStage[];
    view_all_href: string;
};

export type DashboardRecentItem = {
    id: number;
    type: string;
    subject: string;
    at?: string | null;
    recordRef?: RecordRef | null;
    related: { type: string; id: number; label: string }[];
};

export type DashboardRecent = {
    kind: 'logged_activity' | string;
    items: DashboardRecentItem[];
    view_all_href: string;
};

export type { ActivationState as DashboardActivation } from '@/lib/activation';

export function dashboardWorkHref(group: ActivityQueueGroup | null = null): string {
    return activityQueueHref({
        scope: 'mine',
        group,
        type: null,
        owner_id: null,
        page: 1,
        create: false,
    });
}

export function dashboardAttentionViewAllHref(): string {
    return '/crm/deals?attention=needs_attention';
}

export function dashboardPipelineStageHref(pipelineId: number, stageSlug: string): string {
    return `/crm/deals?pipeline=${pipelineId}&stage=${encodeURIComponent(stageSlug)}`;
}

export function formatDashboardWhen(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: DASHBOARD_TIMEZONE,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 16);
    }
}

/** Time-first Today column. Existing due_at only. No Date.now. */
export function formatDashboardTime(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: DASHBOARD_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(iso));
    } catch {
        return iso.slice(11, 16);
    }
}

export function relatedRecordRef(
    related: { type: string; id: number } | null | undefined,
): RecordRef | null {
    if (!related) {
        return null;
    }

    if (
        related.type === 'deal' ||
        related.type === 'contact' ||
        related.type === 'company' ||
        related.type === 'lead' ||
        related.type === 'quote'
    ) {
        return { type: related.type, id: related.id };
    }

    return null;
}
