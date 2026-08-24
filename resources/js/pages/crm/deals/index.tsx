import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { formatDzd } from '@/components/crm/hub-chrome';
import {
    ColumnFilter,
    CrmEmptyState,
    CrmListFooter,
    CrmListHeader,
    CrmListToolbar,
} from '@/components/crm/list-chrome';
import { StagePills } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    close_date?: string | null;
    created_at?: string;
    last_activity_at?: string | null;
    owner?: { id: number; name: string } | null;
    company?: { name: string } | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    stage?: { id: number; name: string; slug: string } | null;
};

type Member = { id: number; name: string };
type Stage = { id: number; name: string; slug: string };

export default function DealsIndex({
    deals,
    stages,
    stageCounts,
    pipeline,
    members,
    savedFilters,
    activeFilters,
    createOpen,
}: {
    deals: Deal[];
    stages: Stage[];
    stageCounts: { id: number; name: string; slug: string; count: number }[];
    pipeline: { id: number; name: string };
    members: Member[];
    savedFilters: { id: number; name: string }[];
    activeFilters: Record<string, string | null | boolean>;
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const view = String(activeFilters.view ?? 'all');
    const dateOptions = [
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 90 days' },
        { value: 'none', label: 'No date' },
    ];

    return (
        <>
            <Head title="Deals" />
            <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
                <CrmListHeader
                    title="Deals"
                    views={[
                        { key: 'all', label: 'All deals', href: '/crm/deals?view=all' },
                        { key: 'mine', label: 'My deals', href: '/crm/deals?view=mine' },
                        ...savedFilters.map((filter) => ({
                            key: `saved-${filter.id}`,
                            label: filter.name,
                            href: `/crm/deals?filter_id=${filter.id}`,
                        })),
                    ]}
                    activeView={
                        activeFilters.filter_id
                            ? `saved-${activeFilters.filter_id}`
                            : view
                    }
                    primaryLabel="Create deal"
                    onPrimary={() => setDrawer(true)}
                />

                <CrmListToolbar
                    action="/crm/deals"
                    query={String(activeFilters.q ?? '')}
                    sort={String(activeFilters.sort ?? 'last_activity')}
                    sortOptions={[
                        { value: 'last_activity', label: 'Last activity' },
                        { value: 'created_at', label: 'Create date' },
                        { value: 'close_date', label: 'Close date' },
                        { value: 'amount', label: 'Amount' },
                    ]}
                >
                    <input type="hidden" name="view" value={view} />
                    <ColumnFilter
                        name="owner"
                        label="Deal owner"
                        value={String(activeFilters.owner ?? '')}
                        options={[
                            { value: 'unassigned', label: 'Unassigned' },
                            ...members.map((member) => ({
                                value: String(member.id),
                                label: member.name,
                            })),
                        ]}
                    />
                    <ColumnFilter
                        name="create_date"
                        label="Create date"
                        value={String(activeFilters.create_date ?? '')}
                        options={dateOptions}
                    />
                    <ColumnFilter
                        name="last_activity"
                        label="Last activity date"
                        value={String(activeFilters.last_activity ?? '')}
                        options={dateOptions}
                    />
                    <ColumnFilter
                        name="close_date"
                        label="Close date"
                        value={String(activeFilters.close_date ?? '')}
                        options={dateOptions}
                    />
                </CrmListToolbar>

                <StagePills
                    stages={stageCounts}
                    activeSlug={
                        typeof activeFilters.stage === 'string'
                            ? activeFilters.stage
                            : null
                    }
                    hrefFor={(slug) => `/crm/deals?view=${view}&stage=${slug}`}
                />

                {deals.length === 0 ? (
                    <CrmEmptyState
                        line="No deals match this view."
                        actionLabel="Add deal"
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
                                    <th className="px-3 py-2">Deal name</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">Stage</th>
                                    <th className="px-3 py-2">Close date</th>
                                    <th className="px-3 py-2">Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map((deal) => (
                                    <tr
                                        key={deal.id}
                                        className="border-t border-hairline hover:bg-canvas-soft"
                                    >
                                        <td className="px-4 py-2">
                                            <input type="checkbox" aria-label={deal.title} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Link
                                                href={`/crm/deals/${deal.id}`}
                                                className="font-medium text-ink hover:text-brand"
                                            >
                                                {deal.title}
                                            </Link>
                                            <p className="text-[12px] text-muted-foreground">
                                                {deal.company?.name ??
                                                    [deal.contact?.first_name, deal.contact?.last_name]
                                                        .filter(Boolean)
                                                        .join(' ') ??
                                                    '—'}
                                            </p>
                                        </td>
                                        <td className="money px-3 py-2">
                                            {formatDzd(deal.amount_cents)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {deal.stage?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {deal.close_date
                                                ? String(deal.close_date).slice(0, 10)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2">
                                            {deal.owner?.name ?? 'Unassigned'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <CrmListFooter count={deals.length} noun="deals" />
            </div>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create deal"
            >
                <Form
                    id="create-deal-form"
                    action="/crm/deals"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <Field label="Deal name" required>
                                <Input name="title" required />
                            </Field>
                            <Field label="Pipeline" required>
                                <select
                                    name="pipeline_id"
                                    required
                                    defaultValue={pipeline.id}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value={pipeline.id}>{pipeline.name}</option>
                                </select>
                            </Field>
                            <Field label="Deal stage" required>
                                <select
                                    name="stage_id"
                                    required
                                    defaultValue={stages[0]?.id}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Amount">
                                <Input name="amount_dzd" type="number" min={0} step="0.01" />
                            </Field>
                            <Field label="Close date">
                                <Input name="close_date" type="date" />
                            </Field>
                            <Field label="Deal owner">
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
                            </Field>
                            <Field label="Deal type">
                                <select
                                    name="type"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">None</option>
                                    <option value="new_business">New business</option>
                                    <option value="existing_business">Existing business</option>
                                </select>
                            </Field>
                            <Field label="Priority">
                                <select
                                    name="priority"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">None</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </Field>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setDrawer(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    name="add_another"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    Create and add another
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

function Field({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label className="mb-1 block text-[12px]">
                {label}
                {required ? <span className="text-brand"> *</span> : null}
            </Label>
            {children}
        </div>
    );
}

DealsIndex.layout = {
    breadcrumbs: [{ title: 'Deals', href: '/crm/deals' }],
};
