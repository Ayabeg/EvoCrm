/**
 * Evo Design System — DatePicker
 * Registry: shadcn/ui — calendar
 * Source: https://ui.shadcn.com/docs/components/radix/calendar
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: lazy calendar; fr-DZ format; Saturday week start.
 */

import * as React from 'react';

import { CalendarBlank } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { formatDate } from '@/evo/lib/format';
import { Button } from '@/evo/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/evo/ui/popover';

const Calendar = React.lazy(async () => {
    const mod = await import('@/evo/ui/calendar');

    return { default: mod.Calendar };
});

export type DatePickerProps = {
    value?: Date | null;
    onValueChange?: (value: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
};

function DatePicker({
    value,
    onValueChange,
    placeholder = 'Choisir une date',
    disabled,
    id,
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    aria-label={sr.chooseDate}
                    className="w-full justify-start font-normal"
                >
                    <CalendarBlank className="size-3.5 text-[var(--evo-ink-muted)]" aria-hidden />
                    {value ? formatDate(value) : <span className="text-[var(--evo-ink-faint)]">{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <React.Suspense fallback={<div className="p-4 text-[12px] text-[var(--evo-ink-muted)]">{sr.loading}</div>}>
                    <Calendar
                        mode="single"
                        selected={value ?? undefined}
                        onSelect={onValueChange}
                    />
                </React.Suspense>
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };
