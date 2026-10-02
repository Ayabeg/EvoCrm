/**
 * Evo Design System — TagInput
 * Registry: shadcn/ui — combobox
 * Source: https://ui.shadcn.com/docs/components/radix/combobox
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: free-form tags; Enter to add; French SR.
 */

import * as React from 'react';

import { X } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { Badge } from '@/evo/ui/badge';

export type TagInputProps = {
    value?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
};

function TagInput({
    value = [],
    onValueChange,
    placeholder = 'Ajouter une étiquette…',
    disabled,
    className,
    id,
}: TagInputProps) {
    const [draft, setDraft] = React.useState('');

    const add = (raw: string) => {
        const tag = raw.trim();

        if (tag === '' || value.includes(tag)) {
            setDraft('');

            return;
        }

        onValueChange?.([...value, tag]);
        setDraft('');
    };

    return (
        <div
            className={cn(
                'flex min-h-9 flex-wrap items-center gap-1 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-2 py-1',
                'focus-within:ring-2 focus-within:ring-[var(--evo-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--evo-canvas)]',
                disabled && 'opacity-50',
                className,
            )}
        >
            {value.map((tag) => (
                <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                        type="button"
                        className="ms-0.5"
                        aria-label={`${sr.remove} ${tag}`}
                        disabled={disabled}
                        onClick={() => onValueChange?.(value.filter((item) => item !== tag))}
                    >
                        <X className="size-3" aria-hidden />
                    </button>
                </Badge>
            ))}
            <input
                id={id}
                value={draft}
                disabled={disabled}
                placeholder={value.length === 0 ? placeholder : undefined}
                className="min-w-24 flex-1 bg-transparent py-1 text-[13px] outline-none placeholder:text-[var(--evo-ink-faint)]"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        add(draft);
                    }

                    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
                        onValueChange?.(value.slice(0, -1));
                    }
                }}
                onBlur={() => add(draft)}
            />
        </div>
    );
}

export { TagInput };
