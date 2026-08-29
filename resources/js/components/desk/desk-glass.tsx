import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Quiet Desk chrome for thread header and composer.
 * Canvas + hairline only — no frosted glass, no Aurora panel identity.
 */
export function DeskGlass({
    children,
    className,
    as: Tag = 'div',
}: {
    children: ReactNode;
    className?: string;
    as?: 'div' | 'header' | 'footer';
}) {
    return (
        <Tag className={cn('relative border-hairline bg-canvas', className)}>
            {children}
        </Tag>
    );
}
