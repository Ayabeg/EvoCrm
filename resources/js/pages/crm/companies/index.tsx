import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmShell } from '@/components/crm/crm-shell';
import { SkeletonList } from '@/components/crm/empty-room';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import ListViewTable from '@/components/crm/list-view-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';

type Company = {
    id: number;
    name: string;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    owner?: { name: string } | null;
};

export default function CompaniesIndex({
    companies,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    cities,
    wilayas,
    createOpen,
}: {
    companies: Company[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    cities: string[];
    wilayas: string[];
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();

    return (
        <>
            <CrmShell title="Companies">
                <CrmListShell
                title="Companies"
                entity="company"
                basePath="/crm/companies"
                primaryLabel="Add company"
                activeFilters={activeFilters}
                savedFilters={savedFilters}
                listView={listView}
                recordCount={recordCount}
                members={members}
                cities={cities}
                wilayas={wilayas}
            >
                {(columns) => (
                    <>
                        {loading ? (
                            <SkeletonList />
                        ) : companies.length === 0 ? (
                            <CrmEmptyState
                                line="No companies in this view."
                                actionLabel="Add company"
                                onAction={() => setDrawer(true)}
                            />
                        ) : (
                            <div className="min-h-0 flex-1 overflow-auto">
                                <ListViewTable
                                    entity="company"
                                    rows={companies}
                                    columnDefs={listView.columnDefs}
                                    columns={columns}
                                    basePath="/crm/companies"
                                />
                            </div>
                        )}
                        <CrmListFooter count={companies.length} noun="companies" />
                    </>
                )}
            </CrmListShell>
            </CrmShell>

            <CreateDrawer open={drawer} onOpenChange={setDrawer} title="Create company">
                <Form
                    action="/crm/companies"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Name <span className="text-brand">*</span>
                                </Label>
                                <Input name="name" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Domain</Label>
                                <Input name="domain" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">City</Label>
                                <select
                                    name="city"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">None</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>
                                    Cancel
                                </Button>
                                <Button disabled={processing}>Create</Button>
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
