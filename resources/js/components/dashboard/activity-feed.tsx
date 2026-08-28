import { Link } from '@inertiajs/react';

export type ActivityFeedItem = {
    id: number;
    type: string;
    subject: string;
    done: boolean;
    actor?: string | null;
    contact?: string | null;
    deal?: string | null;
    at?: string | null;
    href: string;
};

function formatWhen(at?: string | null): string {
    if (!at) {
        return '';
    }

    const parsed = new Date(at.includes('T') ? at : at.replace(' ', 'T'));

    if (Number.isNaN(parsed.getTime())) {
        return at;
    }

    const delta = Date.now() - parsed.getTime();

    if (delta < 0) {
        return at;
    }

    const minutes = Math.floor(delta / 60_000);

    if (minutes < 1) {
        return 'now';
    }

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d`;
    }

    return at.slice(0, 10);
}

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
    if (items.length === 0) {
        return (
            <p className="text-[13px] leading-5 text-mute">No recent activity.</p>
        );
    }

    return (
        <ul className="divide-y divide-hairline">
            {items.map((item) => (
                <li key={item.id}>
                    <Link
                        href={item.href}
                        className="-mx-1 flex items-baseline justify-between gap-3 rounded-md px-1 py-2 transition-colors duration-150 hover:bg-canvas-soft"
                    >
                        <p className="min-w-0 truncate text-[13px] text-ink">
                            <span className="font-medium">
                                {item.subject}
                                {item.done ? ' (done)' : ''}
                            </span>
                            {item.actor || item.contact || item.deal ? (
                                <span className="text-mute">
                                    {' '}
                                    {[item.actor, item.contact, item.deal]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </span>
                            ) : null}
                        </p>
                        <time
                            className="shrink-0 text-[11px] text-mute"
                            dateTime={item.at ?? undefined}
                        >
                            {formatWhen(item.at)}
                        </time>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
