import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export function QuickActions({
    actions,
}: {
    actions: { label: string; href: string }[];
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
                <Button key={action.href} asChild size="sm" variant="outline">
                    <Link href={action.href}>{action.label}</Link>
                </Button>
            ))}
        </div>
    );
}
