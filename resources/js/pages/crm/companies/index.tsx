import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { hasActiveListFilters } from '@/components/crm/list-query';
import { MorphingForm } from '@/components/crm/morphing-form';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    companyEmptyState,
    companyRowHref,
} from '@/pages/crm/companies/company-columns';
import type { CompanyListRow } from '@/pages/crm/companies/company-columns';

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
    parentCompanies,
    createOpen,
}: {
    companies: CompanyListRow[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: {
        page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    cities: string[];
    wilayas: string[];
    parentCompanies: { id: number; name: string }[];
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();

    return (
        <>
            <Head title="Companies" />
            <div
                className="h-app-workspace flex min-h-0 flex-col bg-canvas-soft"
                data-crm="companies-workspace"
            >
                <CrmListShell
                    resultMode="shared-table"
                    title="Companies"
                    entity="company"
                    basePath="/crm/companies"
                    primaryLabel="Create company"
                    onCreate={() => setDrawer(true)}
                    primarySlot={
                        <MorphingForm
                            label="Create company"
                            title="Create company"
                            open={drawer}
                            onOpenChange={setDrawer}
                        >
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
                                                Name{' '}
                                                <span className="text-brand">
                                                    *
                                                </span>
                                            </Label>
                                            <Input name="name" required />
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Domain
                                            </Label>
                                            <Input name="domain" />
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                City
                                            </Label>
                                            <select
                                                name="city"
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            >
                                                <option value="">None</option>
                                                {cities.map((city) => (
                                                    <option
                                                        key={city}
                                                        value={city}
                                                    >
                                                        {city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Account type
                                            </Label>
                                            <select
                                                name="account_type"
                                                defaultValue="prospect"
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            >
                                                <option value="prospect">
                                                    Prospect
                                                </option>
                                                <option value="customer">
                                                    Customer
                                                </option>
                                                <option value="partner">
                                                    Partner
                                                </option>
                                                <option value="subsidiary">
                                                    Subsidiary
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Parent company
                                            </Label>
                                            <select
                                                name="parent_company_id"
                                                defaultValue=""
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            >
                                                <option value="">None</option>
                                                {parentCompanies.map(
                                                    (parent) => (
                                                        <option
                                                            key={parent.id}
                                                            value={parent.id}
                                                        >
                                                            {parent.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setDrawer(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button disabled={processing}>
                                                Create
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </MorphingForm>
                    }
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    members={members}
                    cities={cities}
                    wilayas={wilayas}
                    className="bg-white"
                    contentClassName="bg-white"
                    rows={companies}
                    rowHref={companyRowHref}
                    empty={companyEmptyState(
                        hasActiveListFilters(activeFilters),
                    )}
                    paginator={paginator}
                    loading={loading}
                    selection={{
                        mode: 'uncontrolled',
                        // Page does not participate now. Not a permanent bulk ban.
                        selectable: false,
                        pageIds: companies.map((company) => company.id),
                    }}
                />
            </div>
        </>
    );
}

CompaniesIndex.layout = {
    breadcrumbs: [{ title: 'Companies', href: '/crm/companies' }],
};
