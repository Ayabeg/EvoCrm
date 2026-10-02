import { usePage } from '@inertiajs/react';
import { applyDocumentLocale, hydrateI18n } from '@/lib/i18n';

type I18nPageProps = {
    locale?: string;
    translations?: Record<string, string>;
};

/**
 * Must mount inside an Inertia page (layouts), never via createInertiaApp({ withApp }).
 * usePage() outside that context throws and whitescreens the app.
 */
export function HydrateI18n() {
    const { locale, translations } = usePage<I18nPageProps>().props;
    hydrateI18n(locale, translations);
    applyDocumentLocale(locale);

    return null;
}
