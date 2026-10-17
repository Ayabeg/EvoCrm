import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { hasActiveListFilters } from '@/components/crm/list-query';
import { MorphingForm } from '@/components/crm/morphing-form';
import type { StagePill } from '@/components/crm/stage-pills';
import TicketLayoutToggle from '@/components/crm/ticket-layout-toggle';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    ticketEmptyState,
    ticketRowHref,
} from '@/pages/crm/tickets/ticket-columns';
import type { TicketListRow } from '@/pages/crm/tickets/ticket-columns';

type Contact = { id: number; first_name: string; last_name?: string | null };

export default function TicketsIndex({
    tickets,
    stagePills,
    contacts,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    paginator,
    createOpen,
    createDefaults,
    serviceMetrics,
}: {
    tickets: TicketListRow[];
    stagePills: StagePill[];
    contacts: Contact[];
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
    createOpen?: boolean;
    createDefaults?: { contact_id?: number | null; deal_id?: number | null };
    serviceMetrics: {
        open: number;
        needs_response: number;
        sla_breached: number;
        waiting_on_us: number;
    };
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const loading = useInertiaLoading();

    return (
        <>
            <Head title="Tickets" />
            <div
                className="h-app-workspace flex min-h-0 flex-col bg-canvas-soft"
                data-crm="tickets-workspace"
            >
                <section
                    aria-label="Customer service queue health"
                    className="grid shrink-0 grid-cols-2 gap-3 border-b border-hairline bg-canvas px-4 py-3 lg:grid-cols-4"
                >
                    <ServiceMetric
                        label="Open tickets"
                        value={serviceMetrics.open}
                        href="/crm/tickets"
                    />
                    <ServiceMetric
                        label="Needs first response"
                        value={serviceMetrics.needs_response}
                        href="/crm/tickets?unanswered=1"
                    />
                    <ServiceMetric
                        label="SLA breached"
                        value={serviceMetrics.sla_breached}
                        tone={
                            serviceMetrics.sla_breached > 0
                                ? 'danger'
                                : 'default'
                        }
                    />
                    <ServiceMetric
                        label="Waiting on us"
                        value={serviceMetrics.waiting_on_us}
                        href="/crm/tickets?status=waiting_on_us"
                    />
                </section>
                <CrmListShell
                    resultMode="shared-table"
                    title="Tickets"
                    entity="ticket"
                    basePath="/crm/tickets"
                    primaryLabel="Create ticket"
                    onCreate={() => setDrawer(true)}
                    primarySlot={
                        <MorphingForm
                            label="Create ticket"
                            title="Create ticket"
                            open={drawer}
                            onOpenChange={setDrawer}
                        >
                            <Form
                                action="/crm/tickets"
                                method="post"
                                className="space-y-3"
                                resetOnSuccess
                                onSuccess={() => setDrawer(false)}
                            >
                                {({ processing }) => (
                                    <>
                                        {createDefaults?.deal_id ? (
                                            <input
                                                type="hidden"
                                                name="deal_id"
                                                value={createDefaults.deal_id}
                                            />
                                        ) : null}
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Subject{' '}
                                                <span className="text-brand">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                name="subject"
                                                required
                                                maxLength={180}
                                            />
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Contact{' '}
                                                <span className="text-brand">
                                                    *
                                                </span>
                                            </Label>
                                            <select
                                                name="contact_id"
                                                required
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                                defaultValue={
                                                    createDefaults?.contact_id
                                                        ? String(
                                                              createDefaults.contact_id,
                                                          )
                                                        : ''
                                                }
                                            >
                                                <option value="" disabled>
                                                    Select a contact
                                                </option>
                                                {contacts.map((contact) => (
                                                    <option
                                                        key={contact.id}
                                                        value={contact.id}
                                                    >
                                                        {contact.first_name}{' '}
                                                        {contact.last_name ??
                                                            ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Priority
                                            </Label>
                                            <select
                                                name="priority"
                                                defaultValue="medium"
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            >
                                                <option value="high">
                                                    High
                                                </option>
                                                <option value="medium">
                                                    Medium
                                                </option>
                                                <option value="low">Low</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="mb-1 block text-[12px]">
                                                Channel
                                            </Label>
                                            <select
                                                name="channel"
                                                defaultValue="manual"
                                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                            >
                                                <option value="whatsapp_cloud">
                                                    WhatsApp
                                                </option>
                                                <option value="email">
                                                    Email
                                                </option>
                                                <option value="manual">
                                                    Manual
                                                </option>
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
                                                Create ticket
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
                    contacts={contacts}
                    stagePills={stagePills}
                    layoutToggle={<TicketLayoutToggle current="list" />}
                    rows={tickets}
                    rowHref={ticketRowHref}
                    empty={ticketEmptyState(
                        hasActiveListFilters(activeFilters),
                    )}
                    paginator={paginator}
                    loading={loading}
                    selection={{
                        mode: 'uncontrolled',
                        selectable: false,
                        pageIds: tickets.map((ticket) => ticket.id),
                    }}
                />
            </div>
        </>
    );
}

function ServiceMetric({
    label,
    value,
    href,
    tone = 'default',
}: {
    label: string;
    value: number;
    href?: string;
    tone?: 'default' | 'danger';
}) {
    const content = (
        <div className="rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 transition-colors hover:bg-muted/40">
            <p className="text-[12px] font-medium text-muted-foreground">
                {label}
            </p>
            <p
                className={`mt-1 text-xl font-semibold ${tone === 'danger' ? 'text-destructive' : 'text-ink'}`}
            >
                {value.toLocaleString()}
            </p>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

TicketsIndex.layout = {
    breadcrumbs: [{ title: 'Tickets', href: '/crm/tickets' }],
};
