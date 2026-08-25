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
            <p className="rounded-lg border border-hairline bg-canvas px-4 py-3 text-ui text-muted-foreground">
                No recent activity.
            </p>
        );
    }

    return (
        <div className="rounded-lg border border-hairline bg-canvas">
            <ul className="divide-y divide-hairline">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-canvas-soft"
                        >
                            <p className="text-ui text-ink">
                                <span className="font-medium">
                                    {item.actor ?? 'Someone'}
                                </span>
                                {' · '}
                                {item.subject}
                                {item.done ? ' (done)' : ''}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
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
                    className="text-ui text-brand hover:underline"
                >
                    View all activity
                </Link>
            </div>
        </div>
    );
}
