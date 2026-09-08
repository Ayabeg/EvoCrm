import { Form, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/crm/bulk-action-bar';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmObjectSecondaryLink } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import { SkeletonList } from '@/components/crm/empty-room';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { hasActiveListFilters, listPageHref } from '@/components/crm/list-query';
import ListViewTable from '@/components/crm/list-view-table';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import type { Auth } from '@/types';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    close_date?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    owner?: { id: number; name: string } | null;
    company?: { name: string } | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    stage?: { id: number; name: string; slug: string } | null;
};

type Stage = { id: number; name: string; slug: string };
type Contact = { id: number; first_name: string; last_name?: string | null; company_id?: number | null };

export default function DealsIndex({
    deals,
    stages,
    stagePills,
    pipeline,
    pipelines = [],
    contacts,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    paginator,
    cities,
    wilayas,
    createOpen,
    prefillContactId,
    bulk,
}: {
    deals: Deal[];
    stages: Stage[];
    stagePills: StagePill[];
    pipeline: { id: number; name: string };
    pipelines?: { id: number; name: string; is_default?: boolean }[];
    contacts: Contact[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: { page: number; per_page: number; total: number; last_page: number };
    cities: string[];
    wilayas: string[];
    createOpen?: boolean;
    prefillContactId?: number | null;
    bulk?: { enabled: boolean };
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const loading = useInertiaLoading();
    const { auth } = usePage<{ auth: Auth }>().props;
    const canImport = auth.capabilities.includes('crm.import');
    const canBulk = Boolean(bulk?.enabled);

    return (
        <>
            <CrmShell title="Deals" chrome="workspace">
                <CrmListShell
                title="Deals"
                entity="deal"
                basePath="/crm/deals"
                primaryLabel="Create deal"
                activeFilters={activeFilters}
                savedFilters={savedFilters}
                listView={listView}
                recordCount={recordCount}
                members={members}
                cities={cities}
                wilayas={wilayas}
                contacts={contacts}
                stages={stages}
                stagePills={stagePills}
                exportHref={`/crm/deals/export?pipeline=${pipeline.id}`}
                createHref={`/crm/deals?pipeline=${pipeline.id}&create=1`}
                headerActions={
                    <>
                        {canImport ? (
                            <CrmObjectSecondaryLink href="/crm/deals/import">
                                Import
                            </CrmObjectSecondaryLink>
                        ) : null}
                    </>
                }
                layoutToggle={<DealLayoutToggle current="list" pipelineId={pipeline.id} />}
                pipelineSwitcher={
                    <PipelineSwitcher
                        pipelineId={pipeline.id}
                        pipelines={pipelines}
                        basePath="/crm/deals"
                    />
                }
                extraQuery={{ pipeline: pipeline.id }}
            >
                {(columns) => (
                    <>
                        {canBulk && selectedIds.length > 0 ? (
                            <BulkActionBar
                                entity="deal"
                                selectedIds={selectedIds}
                                members={members}
                                stages={stages}
                                onClear={() => setSelectedIds([])}
                            />
                        ) : null}
                        {loading ? (
                            <SkeletonList />
                        ) : deals.length === 0 ? (
                            <CrmEmptyState
                                title={
                                    hasActiveListFilters(activeFilters)
                                        ? 'No deals match these filters'
                                        : 'No deals yet'
                                }
                                line={
                                    hasActiveListFilters(activeFilters)
                                        ? 'Clear filters or pick another stage to see records.'
                                        : 'Create a deal to start working your pipeline from this list.'
                                }
                                actionLabel={
                                    hasActiveListFilters(activeFilters)
                                        ? undefined
                                        : 'Create deal'
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
                                    entity="deal"
                                    rows={deals}
                                    columnDefs={listView.columnDefs}
                                    columns={columns}
                                    basePath="/crm/deals"
                                    selectable={canBulk}
                                    selectedIds={selectedIds}
                                    onToggle={(id) =>
                                        setSelectedIds((current) =>
                                            current.includes(id)
                                                ? current.filter((value) => value !== id)
                                                : [...current, id],
                                        )
                                    }
                                    onTogglePage={() =>
                                        setSelectedIds((current) => {
                                            const pageIds = deals.map((deal) => deal.id);
                                            const allSelected = pageIds.every((id) => current.includes(id));

                                            return allSelected
                                                ? current.filter((id) => !pageIds.includes(id))
                                                : [...new Set([...current, ...pageIds])];
                                        })
                                    }
                                />
                            </div>
                        )}
                        <CrmListFooter
                            count={deals.length}
                            total={recordCount}
                            noun="deals"
                            exportHref={`/crm/deals/export?pipeline=${pipeline.id}`}
                            page={paginator?.page}
                            lastPage={paginator?.last_page}
                            perPage={paginator?.per_page}
                            prevHref={
                                paginator && paginator.page > 1
                                    ? listPageHref('/crm/deals', activeFilters, paginator.page - 1, {
                                          pipeline: pipeline.id,
                                      })
                                    : null
                            }
                            nextHref={
                                paginator && paginator.page < paginator.last_page
                                    ? listPageHref('/crm/deals', activeFilters, paginator.page + 1, {
                                          pipeline: pipeline.id,
                                      })
                                    : null
                            }
                        />
                    </>
                )}
            </CrmListShell>
            </CrmShell>

            <CreateDrawer open={drawer} onOpenChange={setDrawer} title="Create deal">
                <Form
                    action="/crm/deals"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    Deal name <span className="text-brand">*</span>
                                </Label>
                                <Input name="title" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Amount (DZD)</Label>
                                <Input name="amount_dzd" type="number" min="0" step="0.01" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Contact</Label>
                                <select
                                    name="contact_id"
                                    defaultValue={prefillContactId ?? ''}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">New from deal name</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name ?? ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">Stage</Label>
                                <select
                                    name="stage_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input type="hidden" name="pipeline_id" value={pipeline.id} />
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

DealsIndex.layout = {
    breadcrumbs: [{ title: 'Deals', href: '/crm/deals' }],
};
