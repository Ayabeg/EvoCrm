/**
 * Evo Design System — Form kit
 * Registry: shadcn/ui — form
 * Source: https://ui.shadcn.com/docs/components/radix/form
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: react-hook-form + zod; French messages; Evo tokens.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import {
    Controller,
    FormProvider,
    useFormContext
    
    
    
} from 'react-hook-form';
import type {ControllerProps, FieldPath, FieldValues} from 'react-hook-form';
import type { ZodType } from 'zod';

import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { installFrenchZod } from '@/evo/lib/form-messages';
import { Label } from '@/evo/ui/label';

installFrenchZod();

const Form = FormProvider;

type FormFieldContextValue = { name: string };
const FormFieldContext = React.createContext<FormFieldContextValue>({ name: '' });

function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
}

function useFormField() {
    const fieldContext = React.useContext(FormFieldContext);
    const itemContext = React.useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();
    const fieldState = getFieldState(fieldContext.name, formState);

    return {
        id: itemContext.id,
        name: fieldContext.name,
        formItemId: `${itemContext.id}-form-item`,
        formDescriptionId: `${itemContext.id}-form-item-description`,
        formMessageId: `${itemContext.id}-form-item-message`,
        ...fieldState,
    };
}

const FormItemContext = React.createContext<{ id: string }>({ id: '' });

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
    const id = React.useId();

    return (
        <FormItemContext.Provider value={{ id }}>
            <div className={cn('grid gap-1.5', className)} {...props} />
        </FormItemContext.Provider>
    );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
    const { error, formItemId } = useFormField();

    return (
        <Label
            htmlFor={formItemId}
            className={cn(error && 'text-[var(--evo-danger)]', className)}
            {...props}
        />
    );
}

function FormControl({ children }: { children: React.ReactElement }) {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return React.cloneElement(children, {
        id: formItemId,
        'aria-describedby': error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
        'aria-invalid': error ? true : undefined,
    } as Record<string, unknown>);
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
    const { formDescriptionId } = useFormField();

    return (
        <p
            id={formDescriptionId}
            className={cn('text-[12px] text-[var(--evo-ink-muted)]', className)}
            {...props}
        />
    );
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message) : props.children;

    if (!body) {
        return null;
    }

    return (
        <p
            id={formMessageId}
            role="alert"
            className={cn('text-[12px] text-[var(--evo-danger)]', className)}
            {...props}
        >
            {body}
        </p>
    );
}

function evoZodResolver<T extends ZodType>(schema: T) {
    return zodResolver(schema);
}

export {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    evoZodResolver,
    sr,
    useFormField,
};
