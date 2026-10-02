import { Form, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { MorphingForm } from '@/components/crm/morphing-form';
import SegmentFilterForm from '@/components/crm/segment-filter-form';
import type { SegmentFilters } from '@/components/crm/segment-filter-form';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { t } from '@/lib/i18n';
import type { ListFieldDef } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';

type Segment = {
    id: number;
    name: string;
    entity: string;
    filters: SegmentFilters;
    count: number;
    campaigns: Array<{ id: number; name: string; status: string }>;
};

export default function SegmentsIndex({
    segments,
    members,
    cities,
    wilayas,
    stages,
    contactFilterFields,
    dealFilterFields,
    canSyncMeta,
}: {
    segments: Segment[];
    tab: string;
    members: { id: number; name: string }[];
    cities: string[];
    wilayas: string[];
    stages: { id: number; name: string; slug: string }[];
    contactFilterFields: ListFieldDef[];
    dealFilterFields: ListFieldDef[];
    canSyncMeta: boolean;
}) {
    const [entityFilter, setEntityFilter] = useState<'all' | 'contact' | 'deal'>('all');
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editSegment, setEditSegment] = useState<Segment | null>(null);
    const [createEntity, setCreateEntity] = useState<'contact' | 'deal'>('contact');
    const [draftFilters, setDraftFilters] = useState<SegmentFilters>({});
    const filtered = useMemo(
        () =>
            segments.filter(
                (segment) =>
                    (entityFilter === 'all' || segment.entity === entityFilter) &&
                    (!search.trim() ||
                        segment.name.toLowerCase().includes(search.trim().toLowerCase())),
            ),
        [entityFilter, search, segments],
    );
    const fields = (entity: 'contact' | 'deal') =>
        entity === 'deal' ? dealFilterFields : contactFilterFields;
    const href = (entity: string, id: number) =>
        entity === 'deal' ? `/crm/deals?filter_id=${id}` : `/crm/contacts?filter_id=${id}`;
    const columns: EvoDataGridColumn<Segment>[] = [
        {
            id: 'name',
            header: t('Name'),
            cell: ({ row }) => (
                <Link href={href(row.original.entity, row.original.id)} className="font-medium text-ink hover:underline">
                    {row.original.name}
                </Link>
            ),
        },
        {
            id: 'entity',
            header: t('Entity'),
            cell: ({ row }) => <span className="capitalize text-mute">{row.original.entity}</span>,
        },
        {
            id: 'count',
            header: t('Count'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.count}</span>,
        },
        {
            id: 'campaigns',
            header: t('Campaigns'),
            cell: ({ row }) => (
                <>
                    {row.original.campaigns.map((campaign) => (
                        <Link key={campaign.id} href={`/outbound/campaigns/${campaign.id}`} className="me-2 text-[12px] text-ink hover:underline">
                            {campaign.name}
                        </Link>
                    ))}
                </>
            ),
        },
        {
            id: 'actions',
            header: t('Actions'),
            enableSorting: false,
            cell: ({ row }) => {
                const segment = row.original;

                return (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/crm/segments/${segment.id}`} className="text-[12px] text-mute hover:text-ink">
                            {t('History')}
                        </Link>
                        <MorphingForm
                            label="Edit"
                            title="Edit segment"
                            plainTrigger
                            open={editSegment?.id === segment.id}
                            onOpenChange={(open) => {
                                if (open) {
                                    setEditSegment(segment);
                                    setDraftFilters(segment.filters ?? {});

                                    return;
                                }

                                if (editSegment?.id === segment.id) {
                                    setEditSegment(null);
                                }
                            }}
                        >
                            <Form
                                action={`/crm/segments/${segment.id}`}
                                method="put"
                                className="space-y-3"
                                onSuccess={() => setEditSegment(null)}
                            >
                                {({ processing }) => (
                                    <>
                                        <Input name="name" defaultValue={segment.name} required />
                                        <input type="hidden" name="entity" value={segment.entity} />
                                        <input type="hidden" name="filters_json" value={JSON.stringify(draftFilters)} />
                                        <SegmentFilterForm
                                            entity={segment.entity as 'contact' | 'deal'}
                                            filters={draftFilters}
                                            onChange={setDraftFilters}
                                            members={members}
                                            cities={cities}
                                            wilayas={wilayas}
                                            stages={stages}
                                            filterFields={fields(segment.entity as 'contact' | 'deal')}
                                        />
                                        <div className="flex justify-end">
                                            <Button disabled={processing}>Update</Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </MorphingForm>
                        {segment.entity === 'contact' && canSyncMeta ? (
                            <Form action={`/crm/segments/${segment.id}/sync-meta`} method="post" className="inline-flex items-center gap-1">
                                <Input name="audience_id" placeholder="Audience ID" className="h-7 w-28" />
                                <Button type="submit" size="sm" variant="outline" className="h-7">
                                    Meta
                                </Button>
                            </Form>
                        ) : null}
                        <button
                            type="button"
                            className="text-[12px] text-mute hover:text-ink"
                            onClick={() => confirm('Delete?') && router.delete(`/crm/segments/${segment.id}`)}
                        >
                            {t('Delete')}
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <CrmShell title="Segments" chrome="workspace">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink"
                data-crm="list-workspace"
            >
                <CrmObjectHeader
                    title="Segments"
                    description="Saved views for contacts and deals."
                    primarySlot={
                        <MorphingForm
                            label="New segment"
                            title="New segment"
                            open={createOpen}
                            onOpenChange={(open) => {
                                if (open) {
                                    setDraftFilters({});
                                }

                                setCreateOpen(open);
                            }}
                        >
                            <Form
                                action="/crm/segments"
                                method="post"
                                className="space-y-3"
                                onSuccess={() => setCreateOpen(false)}
                            >
                                {({ processing }) => (
                                    <>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">Name</Label>
                                            <Input name="name" required placeholder="Name" />
                                        </div>
                                        <select
                                            name="entity"
                                            value={createEntity}
                                            onChange={(event) =>
                                                setCreateEntity(event.target.value as 'contact' | 'deal')
                                            }
                                            className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                        >
                                            <option value="contact">Contact</option>
                                            <option value="deal">Deal</option>
                                        </select>
                                        <input type="hidden" name="filters_json" value={JSON.stringify(draftFilters)} />
                                        <SegmentFilterForm
                                            entity={createEntity}
                                            filters={draftFilters}
                                            onChange={setDraftFilters}
                                            members={members}
                                            cities={cities}
                                            wilayas={wilayas}
                                            stages={stages}
                                            filterFields={fields(createEntity)}
                                        />
                                        <div className="flex justify-end">
                                            <Button disabled={processing}>Save</Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </MorphingForm>
                    }
                />
                <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-canvas px-4 py-2 sm:px-6">
                    {(['all', 'contact', 'deal'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setEntityFilter(value)}
                            className={cn(
                                'h-8 rounded-md border px-3 text-[12px] capitalize',
                                entityFilter === value
                                    ? 'border-hairline bg-canvas-soft font-medium text-ink'
                                    : 'border-hairline text-mute hover:text-ink',
                            )}
                        >
                            {value}
                        </button>
                    ))}
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search…"
                        className="h-8 max-w-xs"
                    />
                </div>
                <div className="flex min-h-0 flex-1 flex-col bg-canvas">
                    {filtered.length === 0 ? (
                        <CrmEmptyState
                            title="No segments yet"
                            line="Save a contact or deal view to reuse it as a list filter or campaign audience."
                            actionLabel="New segment"
                            onAction={() => setCreateOpen(true)}
                        />
                    ) : (
                        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-2 md:px-6">
                            <DataGrid
                                columns={columns}
                                data={filtered}
                                getRowId={(segment) => String(segment.id)}
                                density="standard"
                                enableSelection={false}
                                pagination="none"
                                hideColumnPicker
                                embedded
                                enableSorting={false}
                                onRowActivate={(segment, event) => {
                                    if ((event.target as HTMLElement).closest('a,button,input,form,label')) {
                                        return;
                                    }

                                    router.visit(href(segment.entity, segment.id));
                                }}
                            />
                        </div>
                    )}
                    <CrmListFooter count={filtered.length} noun="segments" />
                </div>
            </div>
        </CrmShell>
    );
}

SegmentsIndex.layout = {
    breadcrumbs: [{ title: 'Segments', href: '/crm/segments' }],
};
