import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import type { RecordRef } from '@/ds/workspace/quick-record/types';
import { activityQueueHref } from '@/lib/activity-work-queue';
import type { ActivityQueueGroup, ActivityQueueItem } from '@/lib/activity-work-queue';
import type { DealAttentionQueueItem } from '@/lib/deal-attention';

export const DASHBOARD_TIMEZONE = 'Africa/Algiers';

/** 2×2 below md; 4-col at md+. No horizontal strip scroll. */
export const HOME_KPI_STRIP_TRACK_CLASS =
    'grid grid-cols-2 divide-x divide-y divide-hairline border-y border-hairline md:grid-cols-4 md:divide-y-0';

/** Compact values may wrap; smaller at md (4-col + rail); Brand Book text-kpi from lg. */
export const HOME_KPI_VALUE_CLASS =
    'money min-w-0 max-w-full text-[1.25rem] leading-tight tracking-tight break-words text-ink md:text-[1.125rem] lg:text-kpi';

export type DashboardContext = {
    name: string;
    date: string;
    timezone: string;
};

export type DashboardMetrics = {
    window: {
        from: string;
        to: string;
        label: string;
        timezone: string;
    };
    kpis: KpiTile[];
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
