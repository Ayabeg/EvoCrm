import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export type AttentionItem = {
    key: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
};

function leadingCount(description: string): string | null {
    const match = description.match(/^(\d+)/);

    return match?.[1] ?? null;
}

export function AttentionList({ items }: { items: AttentionItem[] }) {
    if (items.length === 0) {
        return (
            <p className="text-[13px] leading-5 text-mute">
                You&apos;re all caught up.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-hairline">
            {items.map((item) => {
                const count = leadingCount(item.description);

                return (
                    <li
                        key={item.key}
                        className="flex items-start gap-3 py-2 first:pt-0 last:pb-0 sm:items-center"
                    >
                        {count ? (
                            <span className="money w-8 shrink-0 pt-0.5 text-[15px] font-semibold text-ink tabular-nums sm:pt-0">
                                {count}
                            </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-ink">
                                {item.title}
                            </p>
                            <p className="mt-0.5 text-[12px] leading-4 text-mute">
                                {item.description}
                            </p>
                        </div>
                        <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                        >
                            <Link href={item.href}>{item.actionLabel}</Link>
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
}
