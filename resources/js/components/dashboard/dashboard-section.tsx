import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Card elevated={false} className={cn('@container/dashboard-section py-0', className)}>
            <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2 py-4">
                <div>
                    <CardTitle as="h2" className="text-ui font-semibold normal-case tracking-normal">
                        {title}
                    </CardTitle>
                    {description ? (
                        <p className="mt-0.5 text-ui text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {action}
            </CardHeader>
            <CardContent className="pb-4">{children}</CardContent>
        </Card>
    );
}
