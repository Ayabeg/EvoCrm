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
        return <p className="text-[13px] leading-5 text-mute">No recent activity.</p>;
    }

    return (
        <div>
            <ul className="divide-y divide-hairline">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.href}
                            className="-mx-2 flex flex-col gap-0.5 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-canvas-soft"
                        >
                            <p className="text-[13px] text-ink">
                                <span className="font-medium">
                                    {item.actor ?? 'Someone'}
                                </span>
                                {' · '}
                                {item.subject}
                                {item.done ? ' (done)' : ''}
                            </p>
                            <p className="text-[12px] leading-5 text-mute">
                                {[item.contact, item.deal, item.at]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="mt-2 border-t border-hairline pt-3">
                <Link
                    href={viewAllHref}
                    className="text-[12px] text-brand transition-colors hover:underline"
                >
                    View all activity
                </Link>
            </div>
        </div>
    );
}
