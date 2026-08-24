import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
}: {
    matrix: MatrixRow[];
    members: Member[];
}) {
    return (
        <>
            <Head title="Permissions" />
            <div className="space-y-6">
                <Heading
                    title="Permissions"
                    description="Role-based access matrix (v1). Granular member overrides ship in a follow-up."
                />

                <Card className="overflow-hidden border-hairline p-0 shadow-none">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-canvas-soft text-[11px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2">Capability</th>
                                <th className="px-4 py-2">Owner</th>
                                <th className="px-4 py-2">Admin</th>
                                <th className="px-4 py-2">Member</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row) => (
                                <tr key={row.key} className="border-t border-hairline">
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
                    <h2 className="mb-3 text-[14px] font-semibold">Member overrides</h2>
                    <ul className="space-y-2">
                        {members.map((member) => (
                            <li
                                key={member.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline px-3 py-2"
                            >
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-[12px] text-muted-foreground">{member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{member.role}</Badge>
                                    {(member.permissions ?? []).length > 0 ? (
                                        <span className="text-[11px] text-muted-foreground">
                                            {(member.permissions ?? []).join(', ')}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground">Role defaults</span>
                                    )}
                                </div>
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
