import * as React from 'react';

import { FieldError } from '@/evo/ui/field';
import { Input as EvoInput    } from '@/evo/ui/input';
import type {InputProps as EvoInputProps, InputSize, InputState} from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { cn } from '@/lib/utils';

export type { InputSize, InputState };

export type InputProps = Omit<EvoInputProps, 'error'> & {
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
        <EvoInput
            ref={ref}
            id={inputId}
            error={hasError}
            className={cn(className)}
            aria-invalid={hasError || undefined}
            aria-describedby={
                errorMessage ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
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
                <FieldError id={inputId ? `${inputId}-error` : undefined}>{errorMessage}</FieldError>
            ) : null}
        </div>
    );
}

export { Input };
