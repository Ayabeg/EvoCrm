import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { hydrateI18n } from '@/lib/i18n';

type I18nPageProps = {
    locale?: string;
    translations?: Record<string, string>;
};

export function I18nProvider({ children }: { children: ReactNode }) {
    const { locale, translations } = usePage<I18nPageProps>().props;
    hydrateI18n(locale, translations);

    return children;
}
