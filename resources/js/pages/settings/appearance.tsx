import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { LanguageSelector } from '@/components/language-selector';
import { SettingsCard, SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title={t('Appearance settings')} />

            <SettingsPageHeader
                title={t('Preferences')}
                description={t('Language for this account, and cabinet for this browser.')}
            />

            <SettingsCard
                title={t('Language')}
                description={t('Français, English, or العربية. Saved on your account.')}
            >
                <LanguageSelector />
            </SettingsCard>

            <SettingsCard
                title={t('Display')}
                description={t('Applies to this device only.')}
            >
                <AppearanceTabs />
            </SettingsCard>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: t('Appearance settings'),
            href: editAppearance(),
        },
    ],
};
