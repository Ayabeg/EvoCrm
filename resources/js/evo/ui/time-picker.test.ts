import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { formatTimeParts, parseTimeParts } from './time-picker';

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'time-picker.tsx'), 'utf8');

describe('TimePicker 24h', () => {
    it('never uses a native time input or meridian copy', () => {
        expect(source).not.toMatch(/type=["']time["']/);
        expect(source).not.toMatch(/\bAM\b/);
        expect(source).not.toMatch(/\bPM\b/);
        expect(source).not.toMatch(/hour12|ampm|meridiem/i);
        expect(source).toContain('data-hour-cycle="h23"');
        expect(source).toContain('NativeSelect');
        expect(source).toContain('length: 24');
        expect(source).toContain('length: 60');
    });

    it('parses and formats HH:mm in 24h', () => {
        expect(formatTimeParts(0, 0)).toBe('00:00');
        expect(formatTimeParts(9, 5)).toBe('09:05');
        expect(formatTimeParts(13, 45)).toBe('13:45');
        expect(formatTimeParts(23, 59)).toBe('23:59');

        expect(parseTimeParts('00:00')).toEqual({ hour: 0, minute: 0 });
        expect(parseTimeParts('09:05')).toEqual({ hour: 9, minute: 5 });
        expect(parseTimeParts('13:45:00')).toEqual({ hour: 13, minute: 45 });
        expect(parseTimeParts('24:00')).toBeNull();
        expect(parseTimeParts('12:60')).toBeNull();
        expect(parseTimeParts('')).toBeNull();
        expect(parseTimeParts(null)).toBeNull();
    });
});
