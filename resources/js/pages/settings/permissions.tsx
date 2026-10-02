import { Head } from '@inertiajs/react';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Card } from '@/evo/ui/card';
import { SettingsForm, SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type MatrixRow = {
    key: string;
    label: string;
    owner: boolean;
    admin: boolean;
    member: boolean;
};

type Member = {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions?: string[] | null;
};

export default function PermissionsSettings({
    matrix,
    members,
    canManage,
}: {
    matrix: MatrixRow[];
    members: Member[];
    canManage: boolean;
}) {
    return (
        <>
            <Head title={t('Permissions')} />
            <div className="space-y-6">
                <SettingsPageHeader
                    title="Permissions"
                    description="Server-enforced role defaults with owner-controlled member grants."
                />

                <Card className="overflow-hidden border-hairline p-0 shadow-none">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-canvas-soft text-[11px] tracking-wide text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-2">{t('Capability')}</th>
                                <th className="px-4 py-2">{t('Owner')}</th>
                                <th className="px-4 py-2">{t('Admin')}</th>
                                <th className="px-4 py-2">{t('Member')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-t border-hairline"
                                >
                                    <td className="px-4 py-2">{row.label}</td>
                                    <Cell allowed={row.owner} />
                                    <Cell allowed={row.admin} />
                                    <Cell allowed={row.member} />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                <section>
                    <h2 className="mb-3 text-[14px] font-semibold">
                        {t('Member overrides')}
                    </h2>
                    <ul className="space-y-2">
                        {members.map((member) => (
                            <li
                                key={member.id}
                                className="rounded-md border border-hairline px-3 py-2"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium">
                                            {member.name}
                                        </p>
                                        <p className="text-[12px] text-muted-foreground">
                                            {member.email}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {member.role}
                                    </Badge>
                                </div>

                                {member.role === 'member' ? (
                                    <details className="mt-3 border-t border-hairline pt-3">
                                        <summary className="cursor-pointer text-xs font-medium">
                                            Edit additional grants
                                        </summary>
                                        <SettingsForm
                                            action={`/settings/permissions/${member.id}`}
                                            method="put"
                                            className="mt-3 space-y-3"
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {matrix
                                                            .filter(
                                                                (row) =>
                                                                    !row.member,
                                                            )
                                                            .map((row) => (
                                                                <label
                                                                    key={
                                                                        row.key
                                                                    }
                                                                    className="flex items-start gap-2 text-xs"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        name="permissions[]"
                                                                        value={
                                                                            row.key
                                                                        }
                                                                        defaultChecked={(
                                                                            member.permissions ??
                                                                            []
                                                                        ).includes(
                                                                            row.key,
                                                                        )}
                                                                        disabled={
                                                                            !canManage ||
                                                                            processing
                                                                        }
                                                                        className="mt-0.5"
                                                                    />
                                                                    <span>
                                                                        {
                                                                            row.label
                                                                        }
                                                                    </span>
                                                                </label>
                                                            ))}
                                                    </div>
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={
                                                            !canManage ||
                                                            processing
                                                        }
                                                    >
                                                        Save grants
                                                    </Button>
                                                </>
                                            )}
                                        </SettingsForm>
                                    </details>
                                ) : (
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                        Role defaults apply. Only member grants
                                        are editable.
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

function Cell({ allowed }: { allowed: boolean }) {
    return (
        <td className="px-4 py-2">
            <span className={allowed ? 'text-brand' : 'text-muted-foreground'}>
                {allowed ? 'Yes' : '—'}
            </span>
        </td>
    );
}

PermissionsSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: '/settings/profile' },
        { title: 'Permissions', href: '/settings/permissions' },
    ],
};
