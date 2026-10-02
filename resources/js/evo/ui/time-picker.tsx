/**
 * Evo Design System — TimePicker (24h)
 * Registry: custom Evo
 * License: MIT (original)
 * Copied: 2026-10-01
 * Modified: hour + minute NativeSelects; never a native time input (locale meridians).
 */

import * as React from 'react';

import { Clock } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { NativeSelect } from '@/evo/ui/native-select';

export type TimePickerProps = {
    value?: string | null;
    onValueChange?: (value: string | null) => void;
    disabled?: boolean;
    id?: string;
    name?: string;
    className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

export function parseTimeParts(value?: string | null): { hour: number; minute: number } | null {
    if (!value) {
        return null;
    }

    const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());

    if (!match) {
        return null;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    return { hour, minute };
}

export function formatTimeParts(hour: number, minute: number): string {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function TimePicker({ value, onValueChange, disabled, id, name, className }: TimePickerProps) {
    const parsed = parseTimeParts(value);
    const hour = parsed ? String(parsed.hour).padStart(2, '0') : '';
    const minute = parsed ? String(parsed.minute).padStart(2, '0') : '';
    const formatted = parsed ? formatTimeParts(parsed.hour, parsed.minute) : '';

    const commit = (nextHour: string, nextMinute: string) => {
        if (nextHour === '' && nextMinute === '') {
            onValueChange?.(null);

            return;
        }

        const hourValue = nextHour === '' ? 0 : Number(nextHour);
        const minuteValue = nextMinute === '' ? 0 : Number(nextMinute);
        onValueChange?.(formatTimeParts(hourValue, minuteValue));
    };

    return (
        <div
            role="group"
            aria-label={sr.chooseTime}
            data-slot="time-picker"
            data-hour-cycle="h23"
            className={cn(
                'inline-flex h-9 items-center gap-1 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-2',
                'focus-within:ring-2 focus-within:ring-[var(--evo-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--evo-canvas)]',
                disabled && 'opacity-50',
                className,
            )}
        >
            <Clock className="size-3.5 text-[var(--evo-ink-muted)]" aria-hidden />
            <NativeSelect
                id={id}
                aria-label={sr.hour}
                disabled={disabled}
                className="h-8 w-14 border-0 bg-transparent px-1 text-center tabular-nums shadow-none focus-visible:ring-0"
                value={hour}
                onChange={(event) => commit(event.target.value, minute)}
            >
                <option value="">{'—'}</option>
                {HOURS.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </NativeSelect>
            <span className="text-[13px] text-[var(--evo-ink-muted)]" aria-hidden>
                :
            </span>
            <NativeSelect
                aria-label={sr.minute}
                disabled={disabled}
                className="h-8 w-14 border-0 bg-transparent px-1 text-center tabular-nums shadow-none focus-visible:ring-0"
                value={minute}
                onChange={(event) => commit(hour, event.target.value)}
            >
                <option value="">{'—'}</option>
                {MINUTES.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </NativeSelect>
            {name ? <input type="hidden" name={name} value={formatted} /> : null}
        </div>
    );
}

export { TimePicker };
