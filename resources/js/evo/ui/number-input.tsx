/**
 * Evo Design System — NumberInput
 * Registry: ReUI — number-field
 * Source: https://reui.io/components/number-field
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01) — components only
 * Copied: 2026-10-01
 * Modified: trimmed stepper; fr-DZ grouping; Evo tokens; no Base UI.
 */

import { Minus, Plus } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { formatNumber } from '@/evo/lib/format';
import { useCommittedText } from '@/evo/lib/use-committed-text';
import { IconButton } from '@/evo/ui/icon-button';
import { Input } from '@/evo/ui/input';

export type NumberInputProps = {
    value?: number | null;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    id?: string;
    name?: string;
    className?: string;
    'aria-label'?: string;
};

function NumberInput({
    value,
    onValueChange,
    min,
    max,
    step = 1,
    disabled,
    id,
    name,
    className,
    'aria-label': ariaLabel,
}: NumberInputProps) {
    const [text, setText] = useCommittedText(value, (next) => (next == null ? '' : String(next)));

    const commit = (next: number | null) => {
        if (next == null || Number.isNaN(next)) {
            onValueChange?.(null);

            return;
        }

        let clamped = next;

        if (min !== undefined) {
            clamped = Math.max(min, clamped);
        }

        if (max !== undefined) {
            clamped = Math.min(max, clamped);
        }

        onValueChange?.(clamped);
        setText(String(clamped));
    };

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <IconButton
                label={sr.decrement}
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => commit((value ?? 0) - step)}
            >
                <Minus className="size-3.5" aria-hidden />
            </IconButton>
            <Input
                id={id}
                name={name}
                inputMode="decimal"
                aria-label={ariaLabel}
                disabled={disabled}
                value={text}
                className="text-center tabular-nums"
                onChange={(event) => setText(event.target.value)}
                onBlur={() => {
                    const parsed = text.trim() === '' ? null : Number(text.replace(/\s/g, '').replace(',', '.'));
                    commit(parsed);
                }}
            />
            <IconButton
                label={sr.increment}
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => commit((value ?? 0) + step)}
            >
                <Plus className="size-3.5" aria-hidden />
            </IconButton>
            {value != null ? <span className="sr-only">{formatNumber(value)}</span> : null}
        </div>
    );
}

export { NumberInput };
