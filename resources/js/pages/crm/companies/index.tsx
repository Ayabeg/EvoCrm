import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import {
    ColumnFilter,
    CrmEmptyState,
    CrmListFooter,
    CrmListHeader,
    CrmListToolbar,
} from '@/components/crm/list-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Company = {
    id: number;
    name: string;
    domain?: string | null;
    industry?: string | null;
    city?: string | null;
    owner?: { name: string } | null;
};

export default function CompaniesIndex({
    companies,
    members,
    activeFilters,
    createOpen,
}: {
    companies: Company[];
    members: { id: number; name: string }[];
    activeFilters: { view?: string; q?: string; owner?: string | null };
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const view = activeFilters.view ?? 'all';
    const canCreate = name.trim() !== '' || domain.trim() !== '';

    return (
        <>
            <Head title="Companies" />
            <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
                <CrmListHeader
                    title="Companies"
                    views={[
                        { key: 'all', label: 'All companies', href: '/crm/companies?view=all' },
                        { key: 'mine', label: 'My companies', href: '/crm/companies?view=mine' },
                    ]}
                    activeView={view}
                    primaryLabel="Create company"
                    onPrimary={() => setDrawer(true)}
                />
                <CrmListToolbar
                    action="/crm/companies"
                    query={activeFilters.q ?? ''}
                    sort="name"
                    sortOptions={[{ value: 'name', label: 'Name' }]}
                >
                    <input type="hidden" name="view" value={view} />
                    <ColumnFilter
                        name="owner"
                        label="Company owner"
                        value={activeFilters.owner ?? ''}
                        options={[
                            { value: 'unassigned', label: 'Unassigned' },
                            ...members.map((member) => ({
                                value: String(member.id),
                                label: member.name,
                            })),
                        ]}
                    />
                </CrmListToolbar>

                {companies.length === 0 ? (
                    <CrmEmptyState
                        line="No companies yet."
                        actionLabel="Create company"
                        onAction={() => setDrawer(true)}
                    />
                ) : (
                    <div className="min-h-0 flex-1 overflow-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead className="sticky top-0 bg-canvas-soft text-[11px] tracking-wide text-muted-foreground uppercase">
                                <tr>
                                    <th className="w-8 px-4 py-2">
                                        <input type="checkbox" aria-label="Select all" />
                                    </th>
                                    <th className="px-3 py-2">Company name</th>
                                    <th className="px-3 py-2">Domain</th>
                                    <th className="px-3 py-2">Industry</th>
                                    <th className="px-3 py-2">City</th>
                                    <th className="px-3 py-2">Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr
                                        key={company.id}
                                        className="border-t border-hairline hover:bg-canvas-soft"
                                    >
                                        <td className="px-4 py-2">
                                            <input type="checkbox" aria-label={company.name} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Link
                                                href={`/crm/companies/${company.id}`}
                                                className="font-medium hover:text-brand"
                                            >
                                                {company.name}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2">{company.domain ?? '—'}</td>
                                        <td className="px-3 py-2">{company.industry ?? '—'}</td>
                                        <td className="px-3 py-2">{company.city ?? '—'}</td>
                                        <td className="px-3 py-2">
                                            {company.owner?.name ?? 'Unassigned'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <CrmListFooter count={companies.length} noun="companies" />
            </div>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create company"
            >
                <Form
                    action="/crm/companies"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => {
                        setDrawer(false);
                        setName('');
                        setDomain('');
                    }}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">Domain</Label>
                                <Input
                                    name="domain"
                                    value={domain}
                                    onChange={(event) => setDomain(event.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Company name <span className="text-brand">*</span>
                                </Label>
                                <Input
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Owner</Label>
                                <select
                                    name="owner_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Industry</Label>
                                <Input name="industry" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">City</Label>
                                <Input name="city" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDrawer(false)}
                                >
                                    Cancel
                                </Button>
                                <Button disabled={processing || !canCreate}>Create</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </>
    );
}

CompaniesIndex.layout = {
    breadcrumbs: [{ title: 'Companies', href: '/crm/companies' }],
};
