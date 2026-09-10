import type { CatchUpItem } from '@/components/crm/catch-up-block';

export type RecordActivity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
    created_at?: string | null;
    due_at?: string | null;
    owner?: { name?: string | null } | null;
    actor?: { name?: string | null } | null;
    meta?: {
        outcome?: string | null;
        direction?: string | null;
        logged_at?: string | null;
        attendance?: string | null;
    } | null;
};

export const RECORD_ACTIVITY_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'activities', label: 'Activities' },
    { key: 'intelligence', label: 'Intelligence' },
] as const;

export function filterRecordActivity(
    timeline: RecordActivity[],
    tab: string,
): RecordActivity[] {
    if (tab === 'overview') {
        return timeline.slice(0, 5);
    }

    if (tab === 'intelligence') {
        return [];
    }

    return timeline;
}

export function hasCatchUpItems(
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null,
): boolean {
    return Boolean(
        (catchUp?.inbound?.length ?? 0) > 0 ||
            (catchUp?.outbound?.length ?? 0) > 0,
    );
}

export type RecordNext = {
    title: string;
    detail?: string;
    taskId?: number;
    href?: string | null;
};

export function deriveRecordNext(input: {
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    timeline?: RecordActivity[];
    dealNext?: string | null;
}): RecordNext | null {
    const timeline = input.timeline ?? [];
    const now = Date.now();

    const overdue = timeline.find(
        (item) =>
            item.type === 'task' &&
            !item.done &&
            item.due_at &&
            Date.parse(item.due_at) < now,
    );

    if (overdue) {
        return {
            title: overdue.subject ?? overdue.body ?? 'Overdue task',
            detail: 'Task is past due',
            taskId: overdue.id,
        };
    }

    const openTask = timeline.find(
        (item) => item.type === 'task' && !item.done,
    );

    if (openTask) {
        return {
            title: openTask.subject ?? openTask.body ?? 'Open task',
            detail: 'Waiting on this record',
            taskId: openTask.id,
        };
    }

    if (input.dealNext) {
        return { title: input.dealNext };
    }

    const inbound = input.catchUp?.inbound?.[0];

    if (inbound) {
        return {
            title: inbound.label,
            detail: 'Inbound to catch up',
            href: inbound.href,
        };
    }

    return null;
}
