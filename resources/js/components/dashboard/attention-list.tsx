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
            <p
                className="aurora-text-body-sm rounded-[var(--aurora-radius-1)] border px-4 py-3"
                style={{
                    borderColor: 'var(--aurora-border-default)',
                    background: 'var(--aurora-panel-medium)',
                    color: 'var(--aurora-text-muted)',
                }}
            >
                You&apos;re all caught up — nothing requires your attention right
                now.
            </p>
        );
    }

    return (
        <ul
            className="divide-y divide-[var(--aurora-border-default)] overflow-hidden rounded-[var(--aurora-radius-1)] border"
            style={{
                borderColor: 'var(--aurora-border-default)',
                background: 'var(--aurora-panel-medium)',
            }}
        >
            {items.map((item) => (
                <li
                    key={item.key}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="min-w-0">
                        <p
                            className="aurora-text-body-sm font-medium"
                            style={{ color: 'var(--aurora-text-primary)' }}
                        >
                            {item.title}
                        </p>
                        <p
                            className="aurora-text-caption mt-0.5"
                            style={{ color: 'var(--aurora-text-muted)' }}
                        >
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
