/**
 * Evo Design System — Table (static, non-grid)
 * Registry: shadcn/ui — table
 * Source: https://ui.shadcn.com/docs/components/radix/table
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: 32/36 row heights; Evo tokens.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
    return (
        <div className="relative w-full overflow-auto">
            <table className={cn('w-full caption-bottom text-[13px]', className)} {...props} />
        </div>
    );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return <thead className={cn('border-b border-[var(--evo-hairline)]', className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
    return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
    return <tfoot className={cn('border-t border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)]', className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return (
        <tr
            className={cn(
                'h-9 border-b border-[var(--evo-hairline)] data-[state=selected]:bg-[var(--evo-teal-soft)]',
                className,
            )}
            {...props}
        />
    );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
    return (
        <th
            className={cn(
                'h-9 px-3 text-left align-middle text-[11px] font-medium text-[var(--evo-ink-muted)]',
                className,
            )}
            {...props}
        />
    );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
    return <td className={cn('px-3 align-middle', className)} {...props} />;
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
    return <caption className={cn('mt-2 text-[12px] text-[var(--evo-ink-muted)]', className)} {...props} />;
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
