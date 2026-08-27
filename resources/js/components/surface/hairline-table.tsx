import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function HairlineTable({
    children,
    minWidth,
}: {
    children: ReactNode;
    minWidth?: string;
}) {
    return (
        <div className="overflow-x-auto">
            <table
                className="w-full"
                style={minWidth ? { minWidth } : undefined}
            >
                {children}
            </table>
        </div>
    );
}

export function HairlineTh({
    className,
    align = 'left',
    children,
    ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'right';
}) {
    return (
        <th
            className={cn(
                'aurora-text-eyebrow px-4 py-2 font-medium text-mute',
                align === 'right' ? 'text-right' : 'text-left',
                className,
            )}
            {...props}
        >
            {children}
        </th>
    );
}

export function HairlineTd({
    className,
    align = 'left',
    children,
    ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'right';
}) {
    return (
        <td
            className={cn(
                'aurora-text-body-sm px-4 py-2.5 text-ink',
                align === 'right' ? 'text-right' : 'text-left',
                className,
            )}
            {...props}
        >
            {children}
        </td>
    );
}

export function HairlineRow({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <tr className={cn('border-b border-hairline last:border-0', className)}>
            {children}
        </tr>
    );
}
