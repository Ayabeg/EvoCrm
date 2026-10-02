import { Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
    SettingsForm,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

export default function WorkspaceSettings({
    simple_mode,
    workspace_locale,
}: {
    simple_mode: boolean;
    workspace_locale?: string | null;
}) {
    return (
        <>
            <Head title={t('General')} />

            <SettingsPageHeader
                title={t('General')}
                description={t('Simple mode is the sellable launch surface. Turn it off to bring back tickets, ads, warmup, Ask Evo, and report builder.')}
            />

            <SettingsForm action="/settings/workspace" method="put">
                {({ processing }) => (
                    <SettingsCard
                        title={t('Preferences')}
                        required
                        footer={<SettingsSaveBar processing={processing} />}
                    >
                        <SettingsFormRow
                            label={t('Language')}
                            htmlFor="locale"
                            hint={t('Workspace default when a teammate has not chosen a language.')}
                        >
                            <select
                                id="locale"
                                name="locale"
                                defaultValue={workspace_locale ?? ''}
                                className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px] text-ink"
                            >
                                <option value="">{t('Use application default')}</option>
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                            </select>
                        </SettingsFormRow>
                        <SettingsFormRow
                            label={t('Simple mode')}
                            htmlFor="simple_mode"
                            required
                            hint={t('On keeps Home, Contacts, Deals, Inbox, and Quotes. Off restores the full product.')}
                        >
                            <select
                                id="simple_mode"
                                name="simple_mode"
                                defaultValue={simple_mode ? '1' : '0'}
                                className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px] text-ink"
                            >
                                <option value="1">
                                    {t('On - Home, Contacts, Deals, Inbox, Quotes')}
                                </option>
                                <option value="0">{t('Off - full product')}</option>
                            </select>
                        </SettingsFormRow>
                    </SettingsCard>
                )}
            </SettingsForm>
        </>
    );
}

WorkspaceSettings.layout = {
    breadcrumbs: [{ title: t('General'), href: '/settings/workspace' }],
};
