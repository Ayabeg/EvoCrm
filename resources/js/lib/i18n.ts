type Dict = Record<string, string>;

let locale = 'en';
let translations: Dict = {};

export function hydrateI18n(
    nextLocale: string | undefined,
    messages: Dict | null | undefined,
): void {
    locale = nextLocale === 'fr' ? 'fr' : nextLocale || 'en';
    translations = messages ?? {};
}

export function currentLocale(): string {
    return locale;
}

export function dateLocale(): string {
    return locale === 'fr' ? 'fr-DZ' : 'en-GB';
}

/**
 * Day-1 chrome helper. English keys are the fallback so a missing
 * French entry never blanks the UI.
 */
export function t(
    key: string,
    replace: Record<string, string | number> = {},
): string {
    let value = translations[key] ?? key;

    for (const [name, replacement] of Object.entries(replace)) {
        value = value.replaceAll(`:${name}`, String(replacement));
    }

    return value;
}
