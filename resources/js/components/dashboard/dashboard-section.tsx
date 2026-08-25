import type { ReactNode } from 'react';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function DashboardSection({
    title,
    description,
    action,
    children,
    className,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Card elevated={false} className={cn('@container/dashboard-section', className)}>
            <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2">
                <div>
                    <CardTitle as="h2">{title}</CardTitle>
                    {description ? (
                        <CardDescription>{description}</CardDescription>
                    ) : null}
                </div>
                {action ? <CardAction>{action}</CardAction> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
