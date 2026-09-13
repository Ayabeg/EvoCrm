import { Form, Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';

export default function WorkspaceSettings({
    simple_mode,
}: {
    simple_mode: boolean;
}) {
    return (
        <>
            <Head title="Workspace" />

            <SettingsPageHeader
                title="Workspace"
                description="Simple mode is the sellable launch surface. Turn it off to bring back tickets, ads, warmup, Ask Evo, and report builder."
            />

            <Form action="/settings/workspace" method="put">
                {({ processing }) => (
                    <SettingsCard
                        title="Preferences"
                        required
                        footer={<SettingsSaveBar processing={processing} />}
                    >
                        <SettingsFormRow
                            label="Simple mode"
                            htmlFor="simple_mode"
                            required
                            hint="On keeps Home, Contacts, Deals, Inbox, and Quotes. Off restores the full product."
                        >
                            <select
                                id="simple_mode"
                                name="simple_mode"
                                defaultValue={simple_mode ? '1' : '0'}
                                className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px] text-ink"
                            >
                                <option value="1">
                                    On - Home, Contacts, Deals, Inbox, Quotes
                                </option>
                                <option value="0">Off - full product</option>
                            </select>
                        </SettingsFormRow>
                    </SettingsCard>
                )}
            </Form>
        </>
    );
}

WorkspaceSettings.layout = {
    breadcrumbs: [{ title: 'Workspace', href: '/settings/workspace' }],
};
