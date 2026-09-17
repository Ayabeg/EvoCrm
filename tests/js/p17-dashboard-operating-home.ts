/**
 * Test-only P17 operating-home proofs. Never import from an Inertia page.
 */
import { activityQueueHref, parseActivityQueueSearch } from '../../resources/js/lib/activity-work-queue';
import {
    DASHBOARD_TIMEZONE,
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

console.log('P17 dashboard operating home JS proofs passed');
