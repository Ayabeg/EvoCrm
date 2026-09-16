export const INBOX_CLOSED_STATUSES = ['resolved', 'closed'] as const;

export const INBOX_CHANNEL_FOLDERS = [
    'whatsapp',
    'whatsapp_cloud',
    'email',
    'telegram',
    'sms',
] as const;

export type InboxFolderKey =
    | 'all'
    | 'unassigned'
    | 'mine'
    | 'open'
    | 'closed'
    | (typeof INBOX_CHANNEL_FOLDERS)[number];

export type InboxQuery = {
    thread?: number | null;
    folder?: string;
    q?: string;
    context?: '0' | '1';
};

export type InboxFolderCountMap = Record<string, number>;

export type InboxChannelFolder = {
    key: string;
    label: string;
};

export type InboxMessage = {
    id: number;
    direction: string;
    type?: string;
    body: string;
    status: string;
    failure_reason?: string | null;
    created_at: string;
    user?: { name: string } | null;
};

export type InboxMessageGroup = {
    day: string;
    kind: string;
    messages: InboxMessage[];
};

const ALGIERS = 'Africa/Algiers';

export function isClosedThreadStatus(status: string): boolean {
    return status === 'resolved' || status === 'closed';
}

export function isInboxChannelFolder(
    key: string,
): key is (typeof INBOX_CHANNEL_FOLDERS)[number] {
    return (INBOX_CHANNEL_FOLDERS as readonly string[]).includes(key);
}

export function normalizeInboxFolder(folder?: string | null): InboxFolderKey {
    if (!folder || folder === 'all') {
        return 'all';
    }

    if (
        folder === 'unassigned' ||
        folder === 'mine' ||
        folder === 'open' ||
        folder === 'closed'
    ) {
        return folder;
    }

    if (isInboxChannelFolder(folder)) {
        return folder;
    }

    return 'all';
}

export function inboxChannelFolderKeys(
    channels: InboxChannelFolder[],
): InboxChannelFolder[] {
    return channels.filter((channel) => isInboxChannelFolder(channel.key));
}

export function buildInboxFolders(
    counts: InboxFolderCountMap,
    channelFolders: InboxChannelFolder[],
): Array<{ key: string; label: string; count: number }> {
    return [
        { key: 'all', label: 'All', count: counts.all ?? 0 },
        { key: 'unassigned', label: 'Unassigned', count: counts.unassigned ?? 0 },
        {
            key: 'mine',
            label: 'Assigned to me',
            count: counts.mine ?? 0,
        },
        { key: 'open', label: 'All open', count: counts.open ?? 0 },
        ...inboxChannelFolderKeys(channelFolders).map((channel) => ({
            key: channel.key,
            label: channel.label,
            count: counts[channel.key] ?? 0,
        })),
        { key: 'closed', label: 'All closed', count: counts.closed ?? 0 },
    ];
}

export function inboxSearchParams(query: InboxQuery): Record<string, string> {
    const folder = normalizeInboxFolder(query.folder);
    const params: Record<string, string> = {};

    if (query.thread) {
        params.thread = String(query.thread);
    }

    if (folder !== 'all') {
        params.folder = folder;
    }

    const q = query.q?.trim() ?? '';

    if (q !== '') {
        params.q = q;
    }

    if (query.context === '0') {
        params.context = '0';
    }

    return params;
}

export function isStaleInboxVisit(active: number, incoming: number): boolean {
    return incoming < active;
}

export function algiersDayKey(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: ALGIERS,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function formatInboxDay(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: ALGIERS,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return algiersDayKey(iso);
    }
}

export function messageGroupKind(message: InboxMessage): string {
    return message.type === 'note' ? 'note' : message.direction;
}

export function groupInboxMessages(messages: InboxMessage[]): InboxMessageGroup[] {
    const groups: InboxMessageGroup[] = [];

    for (const message of messages) {
        const day = algiersDayKey(message.created_at);
        const kind = messageGroupKind(message);
        const last = groups[groups.length - 1];

        if (last && last.day === day && last.kind === kind) {
            last.messages.push(message);
        } else {
            groups.push({ day, kind, messages: [message] });
        }
    }

    return groups;
}

export function inboxChannelLabel(
    channel?: { name?: string | null; type?: string | null } | null,
): string {
    if (channel?.name) {
        return channel.name;
    }

    if (channel?.type === 'whatsapp_cloud') {
        return 'WhatsApp Business';
    }

    if (channel?.type === 'whatsapp') {
        return 'WhatsApp';
    }

    if (channel?.type === 'email') {
        return 'Email';
    }

    if (channel?.type === 'sms') {
        return 'SMS';
    }

    if (channel?.type === 'telegram') {
        return 'Telegram';
    }

    return 'Channel';
}
