const STORAGE_KEY = 'evosales.nav.pins';

export const DEFAULT_PINNED = [
    'home',
    'crm',
    'desk',
    'outbound',
    'ads',
    'reports',
] as const;

export type NavPinId = (typeof DEFAULT_PINNED)[number] | string;

export function readPins(): string[] {
    if (typeof window === 'undefined') {
        return [...DEFAULT_PINNED];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [...DEFAULT_PINNED];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return [...DEFAULT_PINNED];
        }

        return parsed.filter((id): id is string => typeof id === 'string');
    } catch {
        return [...DEFAULT_PINNED];
    }
}

export function writePins(ids: string[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function togglePin(id: string, current: string[]): string[] {
    const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

    writePins(next);

    return next;
}
