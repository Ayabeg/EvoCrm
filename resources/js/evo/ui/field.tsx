/**
 * Evo Design System — Field
 * Registry: shadcn/ui — field
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo tokens; product Field* API kept.
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { Label } from '@/evo/ui/label';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: React.ReactNode;
    description?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    htmlFor?: string;
    orientation?: 'vertical' | 'horizontal';
}

function FieldGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

function FieldSet({ className, ...props }: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
    return <fieldset className={cn('grid gap-3', className)} {...props} />;
}

function FieldLegend({ className, ...props }: React.HTMLAttributes<HTMLLegendElement>) {
    return <legend data-slot="field-legend" className={cn('mb-1 text-[12px] font-medium', className)} {...props} />;
}

function FieldContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div data-slot="field-content" className={cn('grid gap-1.5', className)} {...props} />;
}

function FieldTitle({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
    return <span data-slot="field-title" className={cn('text-[13px] font-medium', className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            data-slot="field-description"
            className={cn('text-[12px] text-[var(--evo-ink-muted)]', className)}
            {...props}
        />
    );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
    return <Label data-slot="field-label" className={cn('w-full justify-between', className)} {...props} />;
}

function FieldError({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            role="alert"
            data-slot="field-error"
            className={cn('text-[12px] text-[var(--evo-danger)]', className)}
            {...props}
        />
    );
}

function Field({
    className,
    label,
    description,
    error,
    required,
    htmlFor,
    orientation = 'vertical',
    children,
    ...props
}: FieldProps) {
    return (
        <div
            data-slot="field"
            className={cn(
                'grid gap-1.5',
                orientation === 'horizontal' && 'grid-cols-[10rem_1fr] items-start',
                className,
            )}
            {...props}
        >
            {label ? (
                <FieldLabel htmlFor={htmlFor}>
                    {label}
                    {required ? <span className="text-[var(--evo-danger)]"> *</span> : null}
                </FieldLabel>
            ) : null}
            <FieldContent>
                {children}
                {description && !error ? <FieldDescription>{description}</FieldDescription> : null}
                {error ? <FieldError>{error}</FieldError> : null}
            </FieldContent>
        </div>
    );
}

export {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
};
export default Field;
