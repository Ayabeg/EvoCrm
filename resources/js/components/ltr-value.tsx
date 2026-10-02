import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Isolate technical values so RTL does not reorder marks like `+213…`
 * into `213…+`. Use for phones, emails, IDs, URLs, and amounts.
 */
export function LtrValue({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    if (children == null || children === '' || children === '—') {
        return <>{children}</>;
    }

    return (
        <bdi dir="ltr" className={cn('ltr-value', className)} style={{ unicodeBidi: 'isolate' }}>
            {children}
        </bdi>
    );
}

export function looksLikeLtrValue(value: string): boolean {
    const trimmed = value.trim();

    if (trimmed === '' || trimmed === '—') {
        return false;
    }

    return (
        /^[+]?\d[\d\s().-]{5,}$/.test(trimmed) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ||
        /^(https?:\/\/|www\.)/i.test(trimmed) ||
        /\b(?:DV|CAMP|TKT|SEQ|Q)-[A-Z0-9-]+/i.test(trimmed) ||
        /\d[\d\s.,]*\s*DA\b/.test(trimmed)
    );
}

export function shouldIsolateColumn(columnId: string): boolean {
    return ['phone', 'email', 'amount', 'number', 'website', 'url', 'quote_number'].includes(
        columnId,
    );
}
