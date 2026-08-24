import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel, { type AskEvoPayload } from '@/components/crm/ask-evo-panel';
import RecordProperties, { type AttributeBag } from '@/components/crm/record-properties';
import { formatDzd } from '@/components/crm/hub-chrome';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
} from '@/components/crm/record-chrome';
import { Button } from '@/components/ui/button';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    close_date?: string | null;
    type?: string | null;
    priority?: string | null;
    last_activity_at?: string | null;
    owner?: { id: number; name: string } | null;
    owner_id?: number | null;
    contact_id?: number | null;
    company_id?: number | null;
    stage?: { id: number; name: string; slug: string } | null;
    pipeline?: { name: string; stages?: { id: number; name: string }[] } | null;
};

type Activity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
    created_at?: string;
};

export default function DealShow({
    deal,
    associations,
    timeline,
    stages,
    attributes,
    askEvo,
}: {
    deal: Deal;
    associations: {
        contact?: { id: number; first_name: string; last_name?: string | null } | null;
        company?: { id: number; name: string } | null;
    } | null;
    timeline: Activity[];
    stages: { id: number; name: string }[];
    attributes?: AttributeBag;
    askEvo?: AskEvoPayload | null;
}) {
    const [tab, setTab] = useState('all');
    const initials = deal.title
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();

    const items = useMemo(() => {
        if (tab === 'all') {
            return timeline;
        }

        const map: Record<string, string> = {
            notes: 'note',
            emails: 'email',
            calls: 'call',
            tasks: 'task',
            meetings: 'meeting',
        };

        return timeline.filter((item) => item.type === map[tab]);
    }, [tab, timeline]);

    return (
        <>
            <Head title={deal.title} />
            <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
                <div className="border-b border-hairline px-6 py-3">
                    <RecordBack href="/crm/deals" label="Back to Deals" />
                    <div className="mt-3 flex items-start gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-ink text-[12px] font-medium text-canvas">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-[20px] font-semibold">{deal.title}</h1>
                            <div className="mt-2 flex flex-wrap gap-6 text-[13px]">
                                <Stat label="Amount" value={formatDzd(deal.amount_cents)} />
                                <Stat
                                    label="Close date"
                                    value={
                                        deal.close_date
                                            ? String(deal.close_date).slice(0, 10)
                                            : '—'
                                    }
                                />
                                <Stat
                                    label="Pipeline"
                                    value={deal.pipeline?.name ?? 'Sales pipeline'}
                                />
                                <div>
                                    <p className="text-[11px] text-muted-foreground">Stage</p>
                                    <span className="mt-0.5 inline-flex rounded-full bg-[#EC6025] px-2 py-0.5 text-[11px] text-canvas">
                                        {deal.stage?.name}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <RecordActions
                                    entityId={deal.id}
                                    dealId={deal.id}
                                    contactId={deal.contact_id}
                                    companyId={deal.company_id}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <RecordShell
                    left={
                        <div className="space-y-4">
                            <AskEvoPanel action={`/crm/deals/${deal.id}/ask`} insight={askEvo} />
                            <h2 className="text-[13px] font-semibold">About this deal</h2>
                            <Field label="Deal owner" value={deal.owner?.name ?? 'Unassigned'} />
                            <Field
                                label="Last contacted"
                                value={
                                    deal.last_activity_at
                                        ? String(deal.last_activity_at).slice(0, 10)
                                        : '—'
                                }
                            />
                            <Field label="Deal type" value={deal.type ?? '—'} />
                            <Field label="Priority" value={deal.priority ?? '—'} />
                            <Form
                                action={`/crm/deals/${deal.id}/move`}
                                method="post"
                                className="space-y-1"
                            >
                                <p className="text-[11px] text-muted-foreground">Move stage</p>
                                <div className="flex flex-wrap gap-1">
                                    {stages.map((stage) => (
                                        <Button
                                            key={stage.id}
                                            name="stage_id"
                                            value={stage.id}
                                            variant="outline"
                                            className="h-7 text-[11px]"
                                        >
                                            {stage.name}
                                        </Button>
                                    ))}
                                </div>
                            </Form>
                            {attributes ? (
                                <RecordProperties
                                    action={`/crm/deals/${deal.id}/attributes`}
                                    attributes={attributes}
                                />
                            ) : null}
                        </div>
                    }
                    center={
                        <div>
                            <ActivityTabs
                                tabs={[
                                    { key: 'all', label: 'All' },
                                    { key: 'notes', label: 'Notes' },
                                    { key: 'emails', label: 'Emails' },
                                    { key: 'calls', label: 'Calls' },
                                    { key: 'tasks', label: 'Tasks' },
                                    { key: 'meetings', label: 'Meetings' },
                                ]}
                                active={tab}
                                onChange={setTab}
                            />
                            <div className="mt-4 space-y-3">
                                {items.length === 0 ? (
                                    <p className="text-muted-foreground">No activity yet.</p>
                                ) : (
                                    items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border-l-2 border-brand pl-3"
                                        >
                                            <p className="text-[11px] uppercase text-muted-foreground">
                                                {item.type}
                                            </p>
                                            <p className="font-medium">
                                                {item.subject ?? item.body}
                                            </p>
                                            {item.type === 'task' && !item.done ? (
                                                <Form
                                                    action={`/crm/activities/${item.id}/complete`}
                                                    method="post"
                                                >
                                                    <Button
                                                        variant="secondary"
                                                        className="mt-1 h-6 text-[11px]"
                                                    >
                                                        Done
                                                    </Button>
                                                </Form>
                                            ) : null}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    }
                    right={
                        <div className="space-y-3">
                            <AssociationCard title="Contacts">
                                {associations?.contact ? (
                                    <Link
                                        href={`/crm/contacts/${associations.contact.id}`}
                                        className="text-brand"
                                    >
                                        {associations.contact.first_name}{' '}
                                        {associations.contact.last_name}
                                    </Link>
                                ) : (
                                    <p className="text-muted-foreground">No contact</p>
                                )}
                            </AssociationCard>
                            <AssociationCard title="Companies">
                                {associations?.company ? (
                                    <Link
                                        href={`/crm/companies/${associations.company.id}`}
                                        className="text-brand"
                                    >
                                        {associations.company.name}
                                    </Link>
                                ) : (
                                    <p className="text-muted-foreground">No company</p>
                                )}
                            </AssociationCard>
                            <AssociationCard title="Tickets" empty="No tickets" />
                        </div>
                    }
                />
            </div>
        </>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    );
}

DealShow.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Deal', href: '#' },
    ],
};
