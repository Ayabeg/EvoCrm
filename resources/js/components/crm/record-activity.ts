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
};

export const RECORD_ACTIVITY_TABS = [
    { key: 'activity', label: 'Activity' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'notes', label: 'Notes' },
] as const;

export function filterRecordActivity(
    timeline: RecordActivity[],
    tab: string,
): RecordActivity[] {
    if (tab === 'tasks') {
        return timeline.filter((item) => item.type === 'task');
    }

    if (tab === 'notes') {
        return timeline.filter((item) => item.type === 'note');
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

export function deriveRecordNext(input: {
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    timeline?: RecordActivity[];
    dealNext?: string | null;
}): { title: string; detail?: string } | null {
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
        };
    }

    const openTask = timeline.find(
        (item) => item.type === 'task' && !item.done,
    );

    if (openTask) {
        return {
            title: openTask.subject ?? openTask.body ?? 'Open task',
            detail: 'Waiting on this record',
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
        };
    }

    return null;
}
