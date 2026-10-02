/**
 * Evo Design System — DateRangePicker
 * Registry: ReUI — date-selector
 * Source: https://reui.io/components/date-selector
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01) — components only
 * Copied: 2026-10-01
 * Modified: trimmed presets; fr locale; Saturday week start; lazy calendar; no nuqs.
 */

import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { CalendarBlank } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { formatDate } from '@/evo/lib/format';
import { Button } from '@/evo/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/evo/ui/popover';

const Calendar = React.lazy(async () => {
    const mod = await import('@/evo/ui/calendar');

    return { default: mod.Calendar };
});

export type DateRangePickerProps = {
    value?: DateRange;
    onValueChange?: (value: DateRange | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    defaultOpen?: boolean;
};

function DateRangePicker({
    value,
    onValueChange,
    placeholder = 'Choisir une période',
    disabled,
    id,
    defaultOpen = false,
}: DateRangePickerProps) {
    const label =
        value?.from && value.to
            ? `${formatDate(value.from)} – ${formatDate(value.to)}`
            : value?.from
              ? formatDate(value.from)
              : placeholder;

    return (
        <Popover defaultOpen={defaultOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    aria-label={sr.chooseDate}
                    className="w-full justify-start font-normal"
                >
                    <CalendarBlank className="size-3.5 text-[var(--evo-ink-muted)]" aria-hidden />
                    <span className={!value?.from ? 'text-[var(--evo-ink-faint)]' : undefined}>{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <React.Suspense fallback={<div className="p-4 text-[12px] text-[var(--evo-ink-muted)]">{sr.loading}</div>}>
                    <Calendar
                        mode="range"
                        selected={value}
                        onSelect={onValueChange}
                        numberOfMonths={2}
                    />
                </React.Suspense>
            </PopoverContent>
        </Popover>
    );
}

export { DateRangePicker };
