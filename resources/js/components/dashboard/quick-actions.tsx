import { Link } from '@inertiajs/react';
import { Button } from '@/evo/ui/button';

export function QuickActions({
    actions,
}: {
    actions: { label: string; href: string }[];
}) {
    return (
        <div className="flex flex-wrap items-center gap-1">
            {actions.map((action) => (
                <Button key={action.href} asChild size="sm" variant="ghost">
                    <Link href={action.href}>{action.label}</Link>
                </Button>
            ))}
        </div>
    );
}
