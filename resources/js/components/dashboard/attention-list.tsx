import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export type AttentionItem = {
    key: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
    if (items.length === 0) {
        return (
            <p className="aurora-text-body-sm rounded-xl border border-hairline bg-canvas px-4 py-3 text-mute">
                You&apos;re all caught up — nothing requires your attention right
                now.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-canvas">
            {items.map((item) => (
                <li
                    key={item.key}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="min-w-0">
                        <p className="aurora-text-body-sm font-medium text-ink">
                            {item.title}
                        </p>
                        <p className="aurora-text-caption mt-0.5 text-mute">
                            {item.description}
                        </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                        <Link href={item.href}>{item.actionLabel}</Link>
                    </Button>
                </li>
            ))}
        </ul>
    );
}
