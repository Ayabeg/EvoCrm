import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            <div className="space-y-6">
                <Heading
                    title="Quotas"
                    description={`Monthly closed-won target in DZD. Home compares ${month_label} against these numbers (${timezone}). Empty means no target.`}
                />
                <Form action="/settings/quotas" method="put" className="space-y-6">
                    {({ processing }) => (
                        <>
                            <div className="max-w-sm space-y-1.5">
                                <Label htmlFor="workspace-quota">
                                    Workspace monthly target (DZD)
                                </Label>
                                <Input
                                    id="workspace-quota"
                                    name="workspace_amount_dzd"
                                    type="number"
                                    min={0}
                                    step={1}
                                    defaultValue={workspace_amount_dzd ?? ''}
                                    placeholder="8000000"
                                />
                                <p className="text-[12px] text-mute">
                                    Company number on Home. Not the sum of people
                                    below.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-[13px] font-semibold text-ink">
                                    Per person
                                </h2>
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
                                                            person.amount_dzd ??
                                                            ''
                                                        }
                                                        className="ml-auto max-w-[10rem] text-right"
                                                        placeholder="—"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Button type="submit" size="sm" disabled={processing}>
                                Save quotas
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

QuotaSettings.layout = {
    breadcrumbs: [{ title: 'Quotas', href: '/settings/quotas' }],
};
