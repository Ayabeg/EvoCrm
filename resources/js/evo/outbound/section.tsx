import type { ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';

export function OutboundSection({
    title,
    description,
    actions,
    children,
    className,
}: {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('space-y-3 border-t border-[var(--evo-hairline)] pt-3', className)}>
            {title || actions ? (
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                        {title ? (
                            <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">{title}</h2>
                        ) : null}
                        {description ? (
                            <p className="mt-0.5 max-w-[70ch] text-[12px] text-[var(--evo-ink-muted)]">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    {actions}
                </div>
            ) : null}
            {children}
        </section>
    );
}

export function Field({
    label,
    htmlFor,
    hint,
    error,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <label htmlFor={htmlFor} className="text-[12px] font-medium text-[var(--evo-ink)]">
                {label}
            </label>
            {children}
            {hint ? <p className="text-[11px] text-[var(--evo-ink-muted)]">{hint}</p> : null}
            {error ? <p className="text-[11px] text-[var(--evo-danger)]">{error}</p> : null}
        </div>
    );
}
