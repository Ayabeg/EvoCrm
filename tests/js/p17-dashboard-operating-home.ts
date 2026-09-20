/**
 * Test-only P17 operating-home proofs. Never import from an Inertia page.
 */
import { activityQueueHref, parseActivityQueueSearch } from '../../resources/js/lib/activity-work-queue';
import {
    DASHBOARD_TIMEZONE,
    HOME_KPI_STRIP_TRACK_CLASS,
    HOME_KPI_VALUE_CLASS,
    dashboardAttentionViewAllHref,
    dashboardPipelineStageHref,
    dashboardWorkHref,
    formatDashboardWhen,
    relatedRecordRef,
} from '../../resources/js/lib/dashboard-operating-home';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(DASHBOARD_TIMEZONE, 'Africa/Algiers', 'timezone');
expectEqual(dashboardAttentionViewAllHref(), '/crm/deals?attention=needs_attention', 'attention view all');
expectEqual(dashboardWorkHref(null), '/crm/activities', 'work view all');
expectEqual(dashboardWorkHref('overdue'), '/crm/activities?group=overdue', 'overdue href');
expectEqual(dashboardWorkHref('today'), '/crm/activities?group=today', 'today href');
expectEqual(dashboardWorkHref('upcoming'), '/crm/activities?group=upcoming', 'upcoming href');
expectEqual(
    dashboardPipelineStageHref(9, 'proposal'),
    '/crm/deals?pipeline=9&stage=proposal',
    'stage href',
);

expectEqual(parseActivityQueueSearch('group=overdue').group, 'overdue', 'P15 group parse');
expectEqual(
    activityQueueHref(parseActivityQueueSearch({ group: 'today' })),
    '/crm/activities?group=today',
    'P15 href',
);

expectEqual(relatedRecordRef({ type: 'deal', id: 4 }), { type: 'deal', id: 4 }, 'deal ref');
expectEqual(relatedRecordRef({ type: 'note', id: 1 }), null, 'non-record type');

expectEqual(formatDashboardWhen(null), '', 'empty when');
expectTrue(!formatDashboardWhen('2026-09-16T09:00:00+01:00').includes('NaN'), 'formats Algiers time');

expectTrue(HOME_KPI_STRIP_TRACK_CLASS.includes('grid-cols-2'), 'KPI 2×2 below md');
expectTrue(HOME_KPI_STRIP_TRACK_CLASS.includes('lg:grid-cols-4'), 'KPI 4-col at lg+');
expectTrue(!HOME_KPI_STRIP_TRACK_CLASS.includes('overflow-x-auto'), 'KPI strip is not a horizontal scroller');
expectTrue(HOME_KPI_VALUE_CLASS.includes('break-words'), 'KPI values may wrap');
expectTrue(!HOME_KPI_VALUE_CLASS.includes('whitespace-nowrap'), 'KPI values must not nowrap-collide');
expectTrue(HOME_KPI_VALUE_CLASS.includes('text-[20px]'), 'KPI values stay restrained at 20/26');

console.log('P17 dashboard operating home JS proofs passed');
