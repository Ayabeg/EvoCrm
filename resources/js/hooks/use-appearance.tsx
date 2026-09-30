import { useCallback, useSyncExternalStore } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();

let appearance: Appearance = 'system';

const prefersDark = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveAppearance = (value: Appearance): ResolvedAppearance =>
    value === 'system' ? (prefersDark() ? 'dark' : 'light') : value;

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (value: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = resolveAppearance(value) === 'dark';

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const isAppearance = (value: string | null): value is Appearance =>
    value === 'light' || value === 'dark' || value === 'system';

const readCookieAppearance = (): Appearance | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(/(?:^|;\s*)appearance=([^;]*)/);
    const value = match ? decodeURIComponent(match[1]) : null;

    return isAppearance(value) ? value : null;
};

/** localStorage, then the appearance cookie, then system. */
export const readStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const stored = window.localStorage.getItem('appearance');

    if (isAppearance(stored)) {
        return stored;
    }

    return readCookieAppearance() ?? 'system';
};

const notify = (): void => {
    listeners.forEach((listener) => listener());
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

/**
 * EvoCrm ships Light Cabinet and a near-black Dark Cabinet. The choice
 * persists in localStorage + the `appearance` cookie. app.blade.php reads
 * both before first paint so the cabinet cannot flash.
 */
export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    appearance = readStoredAppearance();
    applyTheme(appearance);

    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
            if (appearance === 'system') {
                applyTheme('system');
                notify();
            }
        });
}

export function useAppearance(): UseAppearanceReturn {
    const current = useSyncExternalStore(
        subscribe,
        () => appearance,
        () => 'system' as Appearance,
    );

    const resolved = useSyncExternalStore(
        subscribe,
        () => resolveAppearance(appearance),
        () => 'light' as ResolvedAppearance,
    );

    const updateAppearance = useCallback((mode: Appearance): void => {
        appearance = mode;
        window.localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
        notify();
    }, []);

    return {
        appearance: current,
        resolvedAppearance: resolved,
        updateAppearance,
    } as const;
}
