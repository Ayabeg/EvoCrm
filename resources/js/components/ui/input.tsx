import * as React from 'react';

import {
    Input as AuroraInput,
    type InputProps as AuroraInputProps,
    type InputSize,
    type InputState,
} from '@/components/ui/aurora/input';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type { InputSize, InputState };

export type InputProps = Omit<AuroraInputProps, 'error'> & {
    label?: string;
    hint?: string;
    error?: boolean | string;
};

function Input({
    label,
    hint,
    error,
    id,
    className,
    ref,
    ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
    const generatedId = React.useId();
    const inputId = id ?? (label ? generatedId : undefined);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const hasError = Boolean(error);

    const control = (
        <AuroraInput
            ref={ref}
            id={inputId}
            error={hasError}
            className={cn(className)}
            aria-invalid={hasError || undefined}
            aria-describedby={
                errorMessage
                    ? `${inputId}-error`
                    : hint
                      ? `${inputId}-hint`
                      : undefined
            }
            {...props}
        />
    );

    if (!label && !hint && !errorMessage) {
        return control;
    }

    return (
        <div className="grid w-full gap-2" data-slot="input-field">
            {label ? (
                <Label htmlFor={inputId} className="text-foreground">
                    {label}
                </Label>
            ) : null}
            {control}
            {hint && !errorMessage ? (
                <p
                    id={inputId ? `${inputId}-hint` : undefined}
                    className="text-muted-foreground text-[length:var(--text-meta)] leading-[var(--text-meta-line)]"
                    data-slot="input-hint"
                >
                    {hint}
                </p>
            ) : null}
            {errorMessage ? (
                <FieldError id={inputId ? `${inputId}-error` : undefined}>
                    {errorMessage}
                </FieldError>
            ) : null}
        </div>
    );
}

export { Input };
