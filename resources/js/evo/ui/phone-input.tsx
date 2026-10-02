/**
 * Evo Design System — PhoneInput (+213)
 * Registry: ReUI — phone-input
 * Source: https://reui.io/components/phone-input
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: default DZ / +213 via evo/lib/format; display grouping; E.164 storage.
 */

import { Phone } from '@/evo/icons';
import { formatPhone, normalizePhone } from '@/evo/lib/format';
import { useCommittedText } from '@/evo/lib/use-committed-text';
import { Input } from '@/evo/ui/input';

export type PhoneInputProps = {
    value?: string | null;
    onValueChange?: (e164: string | null) => void;
    disabled?: boolean;
    id?: string;
    name?: string;
    className?: string;
    'aria-label'?: string;
};

function PhoneInput({
    value,
    onValueChange,
    disabled,
    id,
    name,
    className,
    'aria-label': ariaLabel,
}: PhoneInputProps) {
    const [text, setText] = useCommittedText(value, formatPhone);

    return (
        <Input
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-label={ariaLabel ?? 'Numéro de téléphone'}
            disabled={disabled}
            className={className}
            startAdornment={<Phone className="size-3.5" aria-hidden />}
            value={text}
            placeholder="+213 550 18 80 01"
            onChange={(event) => {
                setText(event.target.value);
                onValueChange?.(normalizePhone(event.target.value));
            }}
            onBlur={() => setText(formatPhone(normalizePhone(text)))}
        />
    );
}

export { PhoneInput };
