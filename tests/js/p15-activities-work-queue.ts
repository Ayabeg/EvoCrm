/**
 * Test-only P15 activity work-queue proofs. Never import from an Inertia page.
 */
import {
    activityQueueHref,
    activityQueueMatchesRequest,
    activityQueueSearchParams,
    isStaleActivityQueueVisit,
    parseActivityQueueSearch,
    patchActivityQueueSearch,
    requestedActivityQueueGroup,
    shouldRenderActivityQueue,
} from '../../resources/js/lib/activity-work-queue';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

expectEqual(
    parseActivityQueueSearch('').scope,
    'mine',
    'default scope is My work',
);
expectEqual(
    parseActivityQueueSearch('scope=all&owner_id=9').owner_id,
    9,
    'All can filter a real assignee',
);
expectEqual(
    parseActivityQueueSearch('date=overdue').group,
    'overdue',
    'legacy date=overdue maps to group',
);
expectEqual(
    parseActivityQueueSearch('date=week').group,
    null,
    'broken week chip is not a group',
);
expectEqual(
    parseActivityQueueSearch('group=today&type=call').type,
    'call',
    'type filter is the existing chip set',
);

const overdueToUpcoming = patchActivityQueueSearch(
    parseActivityQueueSearch('group=overdue'),
    { group: 'today' },
);
const final = patchActivityQueueSearch(overdueToUpcoming, { group: 'upcoming' });
expectEqual(final.group, 'upcoming', 'Overdue → Today → Upcoming ends on Upcoming');
expectEqual(
    activityQueueHref(final),
    '/crm/activities?group=upcoming',
    'final URL is Upcoming only',
);

expectEqual(
    requestedActivityQueueGroup('/crm/activities?group=upcoming'),
    'upcoming',
    'URL requested group is Upcoming',
);
expectEqual(
    activityQueueMatchesRequest('overdue', 'upcoming'),
    false,
    'stale Overdue payload does not match Upcoming URL',
);
expectEqual(
    activityQueueMatchesRequest('upcoming', 'upcoming'),
    true,
    'live Upcoming payload matches',
);
expectEqual(
    shouldRenderActivityQueue({
        payloadGroup: 'overdue',
        requestedGroup: 'upcoming',
        pending: true,
    }),
    false,
    'rapid Overdue→Today→Upcoming does not render stale Overdue',
);
expectEqual(isStaleActivityQueueVisit(3, 1), true, 'generation 1 is stale under 3');
expectEqual(isStaleActivityQueueVisit(3, 3), false, 'current generation is live');

expectEqual(
    activityQueueSearchParams(parseActivityQueueSearch('scope=mine&create=1')),
    { create: '1' },
    'mine is the default and is omitted from the URL',
);

expectEqual(
    patchActivityQueueSearch(parseActivityQueueSearch('scope=all&owner_id=4&page=2'), {
        scope: 'mine',
    }).owner_id,
    null,
    'My work clears a foreign owner filter',
);
