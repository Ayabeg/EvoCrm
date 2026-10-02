/**
 * Evo Design System — MoneyInput (DZD)
 * Registry: ReUI — number-field
 * Source: https://reui.io/components/number-field
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: DA suffix; fr-DZ grouping; no currency style decimals.
 */

import { cn } from '@/evo/lib/cn';
import { formatMoney } from '@/evo/lib/format';
import { useCommittedText } from '@/evo/lib/use-committed-text';
import { Input } from '@/evo/ui/input';

export type MoneyInputProps = {
    value?: number | null;
    onValueChange?: (value: number | null) => void;
    disabled?: boolean;
    id?: string;
    name?: string;
    className?: string;
    'aria-label'?: string;
};

function MoneyInput({ value, onValueChange, disabled, id, name, className, 'aria-label': ariaLabel }: MoneyInputProps) {
    const [text, setText] = useCommittedText(value, (next) => (next == null ? '' : String(next)));

    return (
        <div className={cn('relative', className)}>
            <Input
                id={id}
                name={name}
                inputMode="numeric"
                aria-label={ariaLabel ?? 'Montant en dinars'}
                disabled={disabled}
                value={text}
                className="pr-10 tabular-nums"
                onChange={(event) => {
                    const next = event.target.value.replace(/[^\d\s]/g, '');
                    setText(next);
                    const parsed = next.replace(/\s/g, '');
                    onValueChange?.(parsed === '' ? null : Number(parsed));
                }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-[var(--evo-ink-muted)]">
                DA
            </span>
            {value != null ? <span className="sr-only">{formatMoney(value)}</span> : null}
        </div>
    );
}

export { MoneyInput };
