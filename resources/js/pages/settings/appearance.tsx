import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { SettingsCard, SettingsPageHeader } from '@/components/settings/chrome';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <SettingsPageHeader
                title="Appearance"
                description="Cabinet for this browser. Light Cabinet is the EvoCrm default. Dark Cabinet is near-black with orange actions and teal selection."
            />

            <SettingsCard
                title="Display"
                description="Applies to this device only."
            >
                <AppearanceTabs />
            </SettingsCard>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
