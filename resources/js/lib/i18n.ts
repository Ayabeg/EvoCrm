type Dict = Record<string, string>;

export const SUPPORTED_LOCALES = ['fr', 'en', 'ar'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

let locale: AppLocale = 'en';
let translations: Dict = {};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
    return value === 'fr' || value === 'en' || value === 'ar';
}

export function hydrateI18n(
    nextLocale: string | undefined,
    messages: Dict | null | undefined,
): void {
    locale = isAppLocale(nextLocale) ? nextLocale : 'en';
    translations = messages ?? {};
}

export function currentLocale(): AppLocale {
    return locale;
}

export function isRtl(next = locale): boolean {
    return next === 'ar';
}

export function documentDir(next = locale): 'rtl' | 'ltr' {
    return isRtl(next) ? 'rtl' : 'ltr';
}

/**
 * Intl locale for dates/numbers. Algeria-first: fr-DZ / en-DZ / ar-DZ.
 * Digits stay Latin (`numberingSystem: 'latn'`) in every language.
 */
export function dateLocale(): string {
    if (locale === 'ar') {
        return 'ar-DZ';
    }

    if (locale === 'en') {
        return 'en-DZ';
    }

    return 'fr-DZ';
}

export function intlLocale(): string {
    return dateLocale();
}

/**
 * Chrome helper. English keys are the fallback so a missing
 * entry never blanks the UI.
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

const WORKSPACE_ROLE_KEYS: Record<string, string> = {
    owner: 'owner',
    admin: 'admin',
    member: 'member',
};

/** Workspace membership role shown in the sidebar footer. */
export function workspaceRoleLabel(role: string | null | undefined): string {
    if (!role) {
        return '';
    }

    const key = WORKSPACE_ROLE_KEYS[role.trim().toLowerCase()];

    return key ? t(key) : role;
}

export function applyDocumentLocale(next: string | undefined = locale): void {
    if (typeof document === 'undefined') {
        return;
    }

    const resolved = isAppLocale(next) ? next : 'en';

    document.documentElement.lang = resolved;
    document.documentElement.dir = documentDir(resolved);
    document.documentElement.dataset.locale = resolved;
}
