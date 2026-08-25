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

export function ActivityFeed({
    items,
    viewAllHref = '/crm/activities',
}: {
    items: ActivityFeedItem[];
    viewAllHref?: string;
}) {
    if (items.length === 0) {
        return (
            <p
                className="aurora-text-body-sm rounded-[var(--aurora-radius-1)] border px-4 py-3"
                style={{
                    borderColor: 'var(--aurora-border-default)',
                    background: 'var(--aurora-panel-medium)',
                    color: 'var(--aurora-text-muted)',
                }}
            >
                No recent activity.
            </p>
        );
    }

    return (
        <div
            className="overflow-hidden rounded-[var(--aurora-radius-1)] border"
            style={{
                borderColor: 'var(--aurora-border-default)',
                background: 'var(--aurora-panel-medium)',
            }}
        >
            <ul className="divide-y divide-[var(--aurora-border-default)]">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className="flex flex-col gap-0.5 px-4 py-2.5 transition-colors duration-150 hover:bg-[var(--aurora-hover-bg)]"
                        >
                            <p
                                className="aurora-text-body-sm"
                                style={{ color: 'var(--aurora-text-primary)' }}
                            >
                                <span className="font-medium">
                                    {item.actor ?? 'Someone'}
                                </span>
                                {' · '}
                                {item.subject}
                                {item.done ? ' (done)' : ''}
                            </p>
                            <p
                                className="aurora-text-caption"
                                style={{ color: 'var(--aurora-text-muted)' }}
                            >
                                {[item.contact, item.deal, item.at]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
            <div
                className="border-t px-4 py-2"
                style={{ borderColor: 'var(--aurora-border-default)' }}
            >
                <Link
                    href={viewAllHref}
                    className="aurora-text-body-sm transition-colors hover:underline"
                    style={{ color: 'var(--aurora-accent-primary)' }}
                >
                    View all activity
                </Link>
            </div>
        </div>
    );
}
