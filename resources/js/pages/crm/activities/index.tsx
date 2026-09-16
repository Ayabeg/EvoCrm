import { usePage } from '@inertiajs/react';
import ActivityWorkQueue from '@/components/crm/activity-work-queue';
import { CrmShell } from '@/components/crm/crm-shell';
import type {
    ActivityQueueFilters,
    ActivityQueueItem,
    ActivityQueuePayload,
} from '@/lib/activity-work-queue';

export default function ActivitiesIndex({
    queue,
    members,
    filters,
    capabilities,
}: {
    queue: ActivityQueuePayload;
    activities: ActivityQueueItem[];
    members: { id: number; name: string }[];
    filters: ActivityQueueFilters;
    capabilities: { can_create: boolean; can_complete: boolean };
    recordCount: number;
}) {
    const { url } = usePage();

    return (
        <CrmShell title="Activities">
            <ActivityWorkQueue
                queue={queue}
                members={members}
                filters={filters}
                capabilities={capabilities}
                url={url}
            />
        </CrmShell>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [{ title: 'Activities', href: '/crm/activities' }],
};
