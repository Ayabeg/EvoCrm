import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/crm/bulk-action-bar';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { CrmObjectSecondaryLink } from '@/components/crm/crm-object-header';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import { hasActiveListFilters } from '@/components/crm/list-query';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    dealEmptyState,
    dealRowHref,
} from '@/pages/crm/deals/deal-columns';
import type { DealListRow } from '@/pages/crm/deals/deal-columns';
import type { Auth } from '@/types';

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
    deals: DealListRow[];
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
    const loading = useInertiaLoading();
    const { auth } = usePage<{ auth: Auth }>().props;
    const canImport = auth.capabilities.includes('crm.import');
    const canBulk = Boolean(bulk?.enabled);

    return (
        <>
            <Head title={t('Deals')} />
            <div
                className="flex h-app-workspace min-h-0 flex-col bg-canvas-soft"
                data-crm="deals-workspace"
            >
                <CrmListShell
                    resultMode="shared-table"
                    title="Deals"
                    entity="deal"
                    basePath="/crm/deals"
                    primaryLabel="Create deal"
                    onCreate={() => setDrawer(true)}
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
                    className="bg-white"
                    contentClassName="bg-white"
                    rows={deals}
                    rowHref={dealRowHref}
                    empty={dealEmptyState(hasActiveListFilters(activeFilters))}
                    paginator={paginator}
                    loading={loading}
                    headerActions={
                        <>
                            {canImport ? (
                                <CrmObjectSecondaryLink href="/crm/deals/import">
                                    Import
                                </CrmObjectSecondaryLink>
                            ) : null}
                        </>
                    }
                    layoutToggle={
                        <DealLayoutToggle current="list" pipelineId={pipeline.id} />
                    }
                    pipelineSwitcher={
                        <PipelineSwitcher
                            pipelineId={pipeline.id}
                            pipelines={pipelines}
                            basePath="/crm/deals"
                            activeFilters={activeFilters}
                            extraQuery={{ pipeline: pipeline.id }}
                        />
                    }
                    extraQuery={{ pipeline: pipeline.id }}
                    selection={{
                        mode: 'uncontrolled',
                        selectable: canBulk,
                        pageIds: deals.map((deal) => deal.id),
                    }}
                    bulk={
                        canBulk
                            ? (selection) => (
                                  <BulkActionBar
                                      entity="deal"
                                      selectedIds={selection.selectedIds}
                                      members={members}
                                      stages={stages}
                                      onClear={selection.clearSelection}
                                  />
                              )
                            : undefined
                    }
                />
            </div>

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
                                    {t('Deal name')} <span className="text-brand">*</span>
                                </Label>
                                <Input name="title" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Amount (DZD)')}</Label>
                                <Input name="amount_dzd" type="number" min="0" step="0.01" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Close date')}</Label>
                                <Input name="close_date" type="date" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Contact')}</Label>
                                <select
                                    name="contact_id"
                                    defaultValue={prefillContactId ?? ''}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">{t('New from deal name')}</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.first_name} {contact.last_name ?? ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Stage')}</Label>
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
                                    {t('Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    name="add_another"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    {t('Create and add another')}
                                </Button>
                                <Button disabled={processing}>{t('Create')}</Button>
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
