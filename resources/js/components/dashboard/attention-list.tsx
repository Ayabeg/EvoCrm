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
            <p className="text-[13px] leading-5 text-mute">
                You&apos;re all caught up. Nothing requires your attention right
                now.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-hairline">
            {items.map((item) => (
                <li
                    key={item.key}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">
                            {item.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-5 text-mute">
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
