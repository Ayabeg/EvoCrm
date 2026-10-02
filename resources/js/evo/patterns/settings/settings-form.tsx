import type {
    FormComponentProps,
    FormComponentSlotProps,
    FormDataConvertible,
} from '@inertiajs/core';
import { Form } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
    
    
} from 'react';
import type {FormHTMLAttributes, ReactNode} from 'react';
import { announce } from '@/evo/lib/a11y';
import { settingsCopy } from './copy';
import { useUnsavedChangesGuard } from './unsaved-guard';

export type SettingsFormSlot<TForm extends object = Record<string, unknown>> =
    FormComponentSlotProps<TForm> & {
        dirty: boolean;
        markPristine: () => void;
    };

type SettingsFormContextValue = {
    dirty: boolean;
    processing: boolean;
    markDirty: () => void;
    markPristine: () => void;
};

const SettingsFormContext = createContext<SettingsFormContextValue | null>(null);

export function useSettingsForm(): SettingsFormContextValue | null {
    return useContext(SettingsFormContext);
}

export function focusFirstInvalid(root: ParentNode, errors?: Record<string, string>): boolean {
    const names = errors ? Object.keys(errors) : [];

    for (const name of names) {
        const byName = root.querySelector<HTMLElement>(`[name="${cssEscape(name)}"]`);

        if (byName) {
            byName.focus();

            return true;
        }
    }

    const invalid = root.querySelector<HTMLElement>('[aria-invalid="true"]');

    if (invalid) {
        invalid.focus();

        return true;
    }

    return false;
}

function cssEscape(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
    }

    return value.replace(/["\\]/g, '\\$&');
}

type DefaultForm = Record<string, FormDataConvertible>;

type SettingsFormProps<TForm extends object = DefaultForm> = FormComponentProps<TForm> &
    Omit<FormHTMLAttributes<HTMLFormElement>, keyof FormComponentProps | 'children'> & {
        children: ReactNode | ((slot: SettingsFormSlot<TForm>) => ReactNode);
        guard?: boolean;
    };

/**
 * Inertia Form with dirty tracking, first-invalid focus, and no double submit.
 * Backend action / method / field names stay the Wayfinder contract.
 */
export function SettingsForm<TForm extends object = DefaultForm>({
    children,
    guard = true,
    options,
    onError,
    onSuccess,
    disableWhileProcessing = true,
    ...props
}: SettingsFormProps<TForm>) {
    const [localDirty, setLocalDirty] = useState(false);

    const markDirty = useCallback(() => setLocalDirty(true), []);
    const markPristine = useCallback(() => {
        setLocalDirty(false);
    }, []);

    return (
        <Form
            {...props}
            noValidate
            disableWhileProcessing={disableWhileProcessing}
            options={{ preserveScroll: true, ...options }}
            onError={(errors, ...rest) => {
                focusFirstInvalid(document, errors as Record<string, string>);
                onError?.(errors, ...rest);
            }}
            onSuccess={(...args) => {
                markPristine();
                announce(settingsCopy.saved);
                onSuccess?.(...args);
            }}
            onInput={markDirty}
            onChange={markDirty}
            onReset={markPristine}
        >
            {(slot) => (
                <SettingsFormBody
                    slot={slot as FormComponentSlotProps<TForm>}
                    localDirty={localDirty}
                    markDirty={markDirty}
                    markPristine={markPristine}
                    guard={guard}
                >
                    {children}
                </SettingsFormBody>
            )}
        </Form>
    );
}

function SettingsFormBody<TForm extends object>({
    slot,
    localDirty,
    markDirty,
    markPristine,
    guard,
    children,
}: {
    slot: FormComponentSlotProps<TForm>;
    localDirty: boolean;
    markDirty: () => void;
    markPristine: () => void;
    guard: boolean;
    children: SettingsFormProps<TForm>['children'];
}) {
    const dirty = localDirty || slot.isDirty;
    useUnsavedChangesGuard(guard && dirty && !slot.processing);

    const value = useMemo(
        () => ({
            dirty,
            processing: slot.processing,
            markDirty,
            markPristine,
        }),
        [dirty, markDirty, markPristine, slot.processing],
    );

    const wrapped: SettingsFormSlot<TForm> = {
        ...slot,
        dirty,
        markPristine,
    };

    return (
        <SettingsFormContext.Provider value={value}>
            {typeof children === 'function' ? children(wrapped) : children}
        </SettingsFormContext.Provider>
    );
}

export function SettingsFormProvider({
    dirty,
    processing,
    markDirty,
    markPristine,
    children,
}: SettingsFormContextValue & { children: ReactNode }) {
    const value = useMemo(
        () => ({ dirty, processing, markDirty, markPristine }),
        [dirty, processing, markDirty, markPristine],
    );

    return <SettingsFormContext.Provider value={value}>{children}</SettingsFormContext.Provider>;
}
