import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
    SettingsForm,
} from '@/evo/patterns/settings';
import { MoneyInput } from '@/evo/ui/money-input';
import { t } from '@/lib/i18n';

type PersonQuota = {
    id: number;
    name: string;
    role: string;
    amount_dzd: number | null;
};

function QuotaMoneyField({
    id,
    name,
    defaultValue,
    placeholder,
    className,
}: {
    id?: string;
    name: string;
    defaultValue: number | null;
    placeholder?: string;
    className?: string;
}) {
    const [value, setValue] = useState<number | null>(defaultValue);

    return (
        <div className={className}>
            <MoneyInput
                id={id}
                value={value}
                onValueChange={setValue}
                aria-label={placeholder}
            />
            <input type="hidden" name={name} value={value ?? ''} />
        </div>
    );
}

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
            <Head title={t('Quotas')} />

            <SettingsPageHeader
                title="Quotas"
                description={`Monthly closed-won target in DZD. Home compares ${month_label} against these numbers (${timezone}). Empty means no target.`}
            />

            <SettingsForm action="/settings/quotas" method="put">
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
                            <QuotaMoneyField
                                id="workspace-quota"
                                name="workspace_amount_dzd"
                                defaultValue={workspace_amount_dzd}
                                placeholder="8000000"
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
                                    <tr className="border-b border-hairline text-start">
                                        <th className="px-0 py-1.5 text-[11px] font-medium text-mute">
                                            Person
                                        </th>
                                        <th className="px-0 py-1.5 text-end text-[11px] font-medium text-mute">
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
                                                <span className="ms-2 text-[11px] text-mute">
                                                    {person.role}
                                                </span>
                                            </td>
                                            <td className="px-0 py-2 text-end">
                                                <QuotaMoneyField
                                                    name={`people[${index}][amount_dzd]`}
                                                    defaultValue={person.amount_dzd}
                                                    placeholder="-"
                                                    className="ms-auto max-w-[10rem]"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SettingsCard>
                )}
            </SettingsForm>
        </>
    );
}

QuotaSettings.layout = {
    breadcrumbs: [{ title: 'Quotas', href: '/settings/quotas' }],
};
