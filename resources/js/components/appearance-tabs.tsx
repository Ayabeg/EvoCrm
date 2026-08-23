import { Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('space-y-3', className)} {...props}>
            <div className="inline-flex gap-1 rounded-lg border border-hairline bg-canvas-soft p-1">
                <span className="flex items-center rounded-md bg-canvas px-3.5 py-1.5 text-ink shadow-xs">
                    <Sun className="-ml-1 h-4 w-4 text-brand" />
                    <span className="ml-1.5 text-sm">Light</span>
                </span>
            </div>
            <p className="text-sm text-muted-foreground">
                EvoSales ships Light Cabinet only — white canvas, black ink,
                orange actions. There is no dark mode.
            </p>
        </div>
    );
}
