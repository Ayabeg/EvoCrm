import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky Desk chrome. Web frosted-glass approximation only.
 * Not official Apple Liquid Glass.
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
    const style: CSSProperties = {
        background:
            'linear-gradient(180deg, color-mix(in srgb, var(--aurora-panel-strong) 88%, transparent), color-mix(in srgb, var(--aurora-panel-medium) 92%, transparent))',
        boxShadow:
            'inset 0 1px 0 color-mix(in srgb, white 42%, transparent), var(--aurora-shadow-medium)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    };

    return (
        <Tag
            className={cn('relative isolate border-hairline', className)}
            style={style}
        >
            {children}
        </Tag>
    );
}
