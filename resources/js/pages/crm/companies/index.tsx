import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmShell } from '@/components/crm/crm-shell';
import { SkeletonList } from '@/components/crm/empty-room';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { hasActiveListFilters, listPageHref } from '@/components/crm/list-query';
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
    paginator,
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
    paginator?: { page: number; per_page: number; total: number; last_page: number };
    cities: string[];
    wilayas: string[];
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();

    return (
        <>
            <CrmShell title="Companies" chrome="workspace">
                <CrmListShell
                title="Companies"
                entity="company"
                basePath="/crm/companies"
                primaryLabel="Create company"
                activeFilters={activeFilters}
                savedFilters={savedFilters}
                listView={listView}
                recordCount={recordCount}
                members={members}
                cities={cities}
                wilayas={wilayas}
                selection={{
                    mode: 'uncontrolled',
                    selectable: false,
                    pageIds: companies.map((company) => company.id),
                }}
            >
                {(columns) => (
                    <>
                        {loading ? (
                            <SkeletonList />
                        ) : companies.length === 0 ? (
                            <CrmEmptyState
                                title={
                                    hasActiveListFilters(activeFilters)
                                        ? 'No companies match these filters'
                                        : 'No companies yet'
                                }
                                line={
                                    hasActiveListFilters(activeFilters)
                                        ? 'Clear filters or save a different view to see records.'
                                        : 'Create a company to keep accounts next to their contacts and deals.'
                                }
                                actionLabel={
                                    hasActiveListFilters(activeFilters)
                                        ? undefined
                                        : 'Create company'
                                }
                                onAction={
                                    hasActiveListFilters(activeFilters)
                                        ? undefined
                                        : () => setDrawer(true)
                                }
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
                        <CrmListFooter
                            count={companies.length}
                            total={recordCount}
                            noun="companies"
                            page={paginator?.page}
                            lastPage={paginator?.last_page}
                            perPage={paginator?.per_page}
                            prevHref={
                                paginator && paginator.page > 1
                                    ? listPageHref('/crm/companies', activeFilters, paginator.page - 1)
                                    : null
                            }
                            nextHref={
                                paginator && paginator.page < paginator.last_page
                                    ? listPageHref('/crm/companies', activeFilters, paginator.page + 1)
                                    : null
                            }
                        />
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
