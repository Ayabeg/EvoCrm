/**
 * Evo Design System — MoneyEditor
 * Registry: custom Evo on MoneyInput
 * License: MIT (original)
 */

import { MoneyInput } from '@/evo/ui/money-input';

export function MoneyEditor({
    value,
    onValueChange,
    disabled = false,
    name,
    id,
    label,
}: {
    value: number | null;
    onValueChange?: (value: number | null) => void;
    disabled?: boolean;
    name?: string;
    id?: string;
    label?: string;
}) {
    return (
        <MoneyInput
            id={id}
            name={name}
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            aria-label={label ?? 'Montant en dinars'}
        />
    );
}
