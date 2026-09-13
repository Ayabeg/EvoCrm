import { Form, Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { Input } from '@/components/ui/input';

type PersonQuota = {
    id: number;
    name: string;
    role: string;
    amount_dzd: number | null;
};

export default function QuotaSettings({
    workspace_amount_dzd,
    people,
    month_label,
    timezone,
}: {
    workspace_amount_dzd: number | null;
    people: PersonQuota[];
    month_label: string;
    timezone: string;
}) {
    return (
        <>
            <Head title="Quotas" />

            <SettingsPageHeader
                title="Quotas"
                description={`Monthly closed-won target in DZD. Home compares ${month_label} against these numbers (${timezone}). Empty means no target.`}
            />

            <Form action="/settings/quotas" method="put">
                {({ processing }) => (
                    <SettingsCard
                        title="Monthly targets"
                        footer={
                            <SettingsSaveBar
                                processing={processing}
                                saveLabel="Save quotas"
                            />
                        }
                    >
                        <SettingsFormRow
                            label="Workspace target"
                            htmlFor="workspace-quota"
                            hint="Company number on Home. Not the sum of people below."
                        >
                            <Input
                                id="workspace-quota"
                                name="workspace_amount_dzd"
                                type="number"
                                min={0}
                                step={1}
                                defaultValue={workspace_amount_dzd ?? ''}
                                placeholder="8000000"
                                className="h-8"
                            />
                        </SettingsFormRow>

                        <div>
                            <h3 className="text-[13px] font-semibold text-ink">
                                Per person
                            </h3>
                            <p className="mt-0.5 text-[12px] text-mute">
                                Optional. Blank keeps the person on the Home
                                table without a personal target.
                            </p>
                            <table className="mt-3 w-full">
                                <thead>
                                    <tr className="border-b border-hairline text-left">
                                        <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                            Person
                                        </th>
                                        <th className="px-0 py-1.5 text-right text-[11px] font-medium text-mute">
                                            Monthly target (DZD)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {people.map((person, index) => (
                                        <tr
                                            key={person.id}
                                            className="border-b border-hairline last:border-0"
                                        >
                                            <td className="px-0 py-2 text-[13px] text-ink">
                                                <input
                                                    type="hidden"
                                                    name={`people[${index}][id]`}
                                                    value={person.id}
                                                />
                                                {person.name}
                                                <span className="ml-2 text-[11px] text-mute">
                                                    {person.role}
                                                </span>
                                            </td>
                                            <td className="px-0 py-2 text-right">
                                                <Input
                                                    name={`people[${index}][amount_dzd]`}
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    defaultValue={
                                                        person.amount_dzd ?? ''
                                                    }
                                                    className="ml-auto h-8 max-w-[10rem] text-right"
                                                    placeholder="-"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SettingsCard>
                )}
            </Form>
        </>
    );
}

QuotaSettings.layout = {
    breadcrumbs: [{ title: 'Quotas', href: '/settings/quotas' }],
};
