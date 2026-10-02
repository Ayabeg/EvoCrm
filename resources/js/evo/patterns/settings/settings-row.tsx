import {
    Children,
    cloneElement,
    isValidElement
    
} from 'react';
import type {ReactNode} from 'react';
import { cn } from '@/evo/lib/cn';
import { Label } from '@/evo/ui/label';
import { t } from '@/lib/i18n';

type DescribableProps = {
    'aria-describedby'?: string;
    'aria-invalid'?: boolean | 'true' | 'false';
    'aria-required'?: boolean;
};

function bindDescribedControl(
    children: ReactNode,
    describedBy?: string,
    invalid?: boolean,
    required?: boolean,
): ReactNode {
    let bound = false;

    return Children.map(children, (child) => {
        if (bound || !isValidElement<DescribableProps>(child)) {
            return child;
        }

        bound = true;

        return cloneElement(child, {
            'aria-describedby':
                [child.props['aria-describedby'], describedBy].filter(Boolean).join(' ') ||
                undefined,
            'aria-invalid': invalid ? true : child.props['aria-invalid'],
            'aria-required': required || child.props['aria-required'],
        });
    });
}

export function SettingsRow({
    label,
    htmlFor,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: ReactNode;
}) {
    const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
    const errorId = htmlFor ? `${htmlFor}-error` : undefined;
    const describedBy =
        [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    return (
        <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start sm:gap-x-4">
            <Label
                htmlFor={htmlFor}
                className="pt-1.5 text-[13px] leading-[18px] font-medium text-[var(--evo-ink)]"
            >
                {t(label)}
                {required ? (
                    <span className="ms-0.5 text-[var(--evo-primary)]">*</span>
                ) : null}
            </Label>
            <div className="min-w-0">
                {bindDescribedControl(children, describedBy, Boolean(error), required)}
                {hint ? (
                    <p
                        id={hintId}
                        className={cn('mt-1 text-[12px] leading-4 text-[var(--evo-ink-muted)]')}
                    >
                        {t(hint)}
                    </p>
                ) : null}
                {error ? (
                    <p
                        id={errorId}
                        role="alert"
                        className="mt-1 text-[12px] text-[var(--evo-danger)]"
                    >
                        {error}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export { SettingsRow as SettingsFormRow };
