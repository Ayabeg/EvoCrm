/**
 * Evo Design System — Calendar
 * Registry: shadcn/ui — calendar
 * Source: https://ui.shadcn.com/docs/components/radix/calendar
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: react-day-picker; fr locale; WEEK_STARTS_ON=6; teal selected; Evo tokens.
 */

import { ar, enUS, fr } from 'date-fns/locale';
import * as React from 'react';
import { DayPicker  } from 'react-day-picker';
import type {DayPickerProps} from 'react-day-picker';

import { CaretLeft, CaretRight } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { WEEK_STARTS_ON } from '@/evo/lib/format';
import { buttonVariants } from '@/evo/ui/button';
import { currentLocale } from '@/lib/i18n';

import 'react-day-picker/style.css';

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            weekStartsOn={WEEK_STARTS_ON}
            locale={currentLocale() === 'ar' ? ar : currentLocale() === 'en' ? enUS : fr}
            showOutsideDays={showOutsideDays}
            className={cn('p-2', className)}
            classNames={{
                months: 'flex flex-col gap-4 sm:flex-row',
                month: 'space-y-2',
                month_caption: 'flex items-center justify-center pt-1 text-[13px] font-medium',
                nav: 'flex items-center justify-between',
                button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8'),
                button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8'),
                weekdays: 'flex',
                weekday: 'w-8 text-center text-[11px] text-[var(--evo-ink-muted)]',
                week: 'flex w-full',
                day: 'size-8 p-0 text-center text-[13px]',
                day_button: cn(
                    'size-8 rounded-[var(--evo-radius-compact)] hover:bg-[var(--evo-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                ),
                selected: 'bg-[var(--evo-teal)] text-white hover:bg-[var(--evo-teal)]',
                today: 'font-semibold text-[var(--evo-teal)]',
                outside: 'text-[var(--evo-ink-faint)]',
                disabled: 'opacity-40',
                range_start: 'bg-[var(--evo-teal)] text-white',
                range_end: 'bg-[var(--evo-teal)] text-white',
                range_middle: 'bg-[var(--evo-teal-soft)] text-[var(--evo-ink)]',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const rtl = currentLocale() === 'ar';
                    const back = orientation === 'left';
                    const Icon = back !== rtl ? CaretLeft : CaretRight;

                    return <Icon className="size-4" aria-hidden />;
                },
            }}
            {...props}
        />
    );
}

export { Calendar };
