import * as React from 'react';

import {
    Select as SelectRoot,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/aurora/select';
import { FieldError } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

export type SelectProps = React.ComponentProps<typeof SelectRoot> & {
    label?: string;
    hint?: string;
    error?: boolean | string;
};

function Select({
    label,
    hint,
    error,
    children,
    ...props
}: SelectProps) {
    const generatedId = React.useId();
    const errorMessage = typeof error === 'string' ? error : undefined;
    const labelId = label ? `${generatedId}-label` : undefined;
    const hintId = hint && !errorMessage ? `${generatedId}-hint` : undefined;
    const errorId = errorMessage ? `${generatedId}-error` : undefined;

    const control = <SelectRoot {...props}>{children}</SelectRoot>;

    if (!label && !hint && !errorMessage) {
        return control;
    }

    return (
        <div
            className="grid w-full gap-2"
            data-slot="select-field"
            aria-labelledby={labelId}
            aria-describedby={errorId ?? hintId}
        >
            {label ? (
                <Label id={labelId} className="text-foreground">
                    {label}
                </Label>
            ) : null}
            {control}
            {hint && !errorMessage ? (
                <p
                    id={hintId}
                    className="text-muted-foreground text-[length:var(--text-meta)] leading-[var(--text-meta-line)]"
                    data-slot="select-hint"
                >
                    {hint}
                </p>
            ) : null}
            {errorMessage ? (
                <FieldError id={errorId}>{errorMessage}</FieldError>
            ) : null}
        </div>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
