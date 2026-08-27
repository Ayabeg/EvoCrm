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
            <p className="aurora-text-body-sm rounded-xl border border-hairline bg-canvas px-4 py-3 text-mute">
                No recent activity.
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
            <ul className="divide-y divide-hairline">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className="flex flex-col gap-0.5 px-4 py-2.5 transition-colors duration-150 hover:bg-muted"
                        >
                            <p className="aurora-text-body-sm text-ink">
                                <span className="font-medium">
                                    {item.actor ?? 'Someone'}
                                </span>
                                {' · '}
                                {item.subject}
                                {item.done ? ' (done)' : ''}
                            </p>
                            <p className="aurora-text-caption text-mute">
                                {[item.contact, item.deal, item.at]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="border-t border-hairline px-4 py-2">
                <Link
                    href={viewAllHref}
                    className="aurora-text-body-sm text-brand transition-colors hover:underline"
                >
                    View all activity
                </Link>
            </div>
        </div>
    );
}
