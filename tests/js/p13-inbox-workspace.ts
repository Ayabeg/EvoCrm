/**
 * Test-only P13 inbox workspace proofs. Never import from an Inertia page.
 */
import {
    buildInboxFolders,
    groupInboxMessages,
    inboxChannelFolderKeys,
    inboxChannelLabel,
    inboxSearchParams,
    inboxThreadMatchesRequest,
    isStaleInboxVisit,
    normalizeInboxFolder,
    resolveInboxRequestedThreadId,
} from '../../resources/js/lib/inbox-workspace';
import type { InboxMessage } from '../../resources/js/lib/inbox-workspace';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

expectEqual(normalizeInboxFolder('instagram'), 'all', 'instagram is not a real inbox folder');
expectEqual(normalizeInboxFolder('facebook'), 'all', 'facebook is not a real inbox folder');
expectEqual(normalizeInboxFolder('mine'), 'mine', 'mine folder stays');
expectEqual(normalizeInboxFolder('whatsapp_cloud'), 'whatsapp_cloud', 'whatsapp_cloud folder stays');

expectEqual(
    inboxChannelFolderKeys([
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'instagram', label: 'Instagram' },
        { key: 'facebook', label: 'Facebook' },
    ]),
    [{ key: 'whatsapp', label: 'WhatsApp' }],
    'channel folders drop Instagram/Facebook',
);

const folders = buildInboxFolders(
    { all: 4, unassigned: 1, mine: 2, open: 3, closed: 1, whatsapp: 4, email: 2, sms: 1 },
    [
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'instagram', label: 'Instagram' },
        { key: 'facebook', label: 'Facebook' },
    ],
);

if (folders.some((folder) => folder.key === 'instagram' || folder.key === 'facebook')) {
    throw new Error('buildInboxFolders must not create Instagram folders');
}

if (!folders.some((folder) => folder.key === 'email' && folder.count === 2)) {
    throw new Error('email folder must appear from honest ChannelType counts');
}

if (!folders.some((folder) => folder.key === 'sms' && folder.count === 1)) {
    throw new Error('sms folder must appear from honest ChannelType counts');
}

if (!folders.some((folder) => folder.label === 'Assigned to me')) {
    throw new Error('Assigned to me folder missing');
}

if (!folders.some((folder) => folder.label === 'All open')) {
    throw new Error('All open folder missing');
}

expectEqual(
    inboxSearchParams({ thread: 9, folder: 'open', q: 'amel', context: '0' }),
    { thread: '9', folder: 'open', q: 'amel', context: '0' },
    'inbox URL params',
);

expectEqual(
    inboxSearchParams({ folder: 'all', q: '', context: '1' }),
    {},
    'default inbox URL stays clean',
);

expectEqual(isStaleInboxVisit(3, 2), true, 'older visit is stale');
expectEqual(isStaleInboxVisit(3, 3), false, 'current visit is live');
expectEqual(
    resolveInboxRequestedThreadId({
        pendingId: 12,
        url: '/inbox?thread=9',
        selectedId: 4,
    }),
    12,
    'pending thread wins over stale selected',
);
expectEqual(
    resolveInboxRequestedThreadId({ url: '/inbox?thread=9&folder=open', selectedId: 4 }),
    9,
    'URL thread wins over stale selected',
);
expectEqual(inboxThreadMatchesRequest(4, 9), false, 'old selected must not render');
expectEqual(inboxThreadMatchesRequest(9, 9), true, 'matching selected may render');

const messages: InboxMessage[] = [
    {
        id: 1,
        direction: 'inbound',
        type: 'text',
        body: 'Hello',
        status: 'received',
        created_at: '2026-09-16T08:00:00Z',
    },
    {
        id: 2,
        direction: 'inbound',
        type: 'text',
        body: 'Still there?',
        status: 'received',
        created_at: '2026-09-16T08:02:00Z',
    },
    {
        id: 3,
        direction: 'outbound',
        type: 'text',
        body: 'Yes',
        status: 'sent',
        created_at: '2026-09-16T08:03:00Z',
    },
    {
        id: 4,
        direction: 'internal',
        type: 'note',
        body: 'Private',
        status: 'logged',
        created_at: '2026-09-16T08:04:00Z',
    },
];

const groups = groupInboxMessages(messages);

if (groups.length !== 3) {
    throw new Error(`expected 3 message groups, got ${groups.length}`);
}

if (groups[0]?.messages.length !== 2 || groups[0]?.kind !== 'inbound') {
    throw new Error('inbound messages on the same Algiers day must group');
}

if (groups[1]?.kind !== 'outbound' || groups[2]?.kind !== 'note') {
    throw new Error('outbound and notes must start new groups');
}

expectEqual(inboxChannelLabel({ name: 'Clinic WA', type: 'whatsapp' }), 'Clinic WA', 'channel name wins');
expectEqual(inboxChannelLabel({ type: 'whatsapp_cloud' }), 'WhatsApp Business', 'cloud fallback label');
