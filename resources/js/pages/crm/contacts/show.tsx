import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
} from '@/components/crm/record-chrome';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    lead_status?: string | null;
    created_at?: string;
    company_id?: number | null;
    company?: { id: number; name: string } | null;
};

type Activity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
};

export default function ContactShow({
    contact,
    associations,
    timeline,
}: {
    contact: Contact;
    associations: {
        company?: { id: number; name: string } | null;
        deals?: { id: number; title: string; stage?: { name: string } }[];
    } | null;
    timeline: Activity[];
}) {
    const [tab, setTab] = useState('catchup');
    const [railOpen, setRailOpen] = useState(true);
    const name = `${contact.first_name} ${contact.last_name ?? ''}`.trim();

    const inbound = useMemo(
        () =>
            timeline.filter((item) =>
                ['note', 'call', 'email'].includes(item.type),
            ).slice(0, 4),
        [timeline],
    );
    const outbound = useMemo(
        () => timeline.filter((item) => item.type === 'task').slice(0, 4),
        [timeline],
    );

    return (
        <>
            <Head title={name} />
            <div className="flex h-[calc(100vh-52px)] flex-col bg-canvas text-[13px] text-ink">
                <div className="border-b border-hairline px-6 py-3">
                    <RecordBack href="/crm/contacts" label="Back to Contacts" />
                    <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-[20px] font-semibold">{name}</h1>
                            <p className="text-muted-foreground">
                                {contact.company?.name ?? 'No company'}
                                {contact.email ? ` · ${contact.email}` : ''}
                            </p>
                            <div className="mt-3">
                                <RecordActions
                                    entityId={contact.id}
                                    contactId={contact.id}
                                    companyId={contact.company_id}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRailOpen((open) => !open)}
                            className="text-[12px] text-brand"
                        >
                            {railOpen ? 'Collapse associations' : 'Show associations'}
                        </button>
                    </div>
                </div>

                <div
                    className={cn(
                        'grid min-h-0 flex-1 overflow-hidden',
                        railOpen
                            ? 'lg:grid-cols-[260px_minmax(0,1fr)_260px]'
                            : 'lg:grid-cols-[260px_minmax(0,1fr)]',
                    )}
                >
                    <aside className="min-h-0 overflow-y-auto border-r border-hairline p-4">
                        <h2 className="mb-3 text-[13px] font-semibold">
                            Key information
                        </h2>
                        <Field label="Email" value={contact.email ?? '—'} />
                        <Field label="Phone" value={contact.phone_e164 ?? '—'} />
                        <Field label="Preferred channels" value="WhatsApp Cloud, Email" />
                        <Field label="Lead status" value={contact.lead_status ?? '—'} />
                        <Field
                            label="Create date"
                            value={
                                contact.created_at
                                    ? String(contact.created_at).slice(0, 10)
                                    : '—'
                            }
                        />
                        <div className="mt-4 space-y-2">
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                                Actions
                            </p>
                            <Link href="/inbox" className="block text-brand">
                                Open in Desk
                            </Link>
                            <Link href="/outbound" className="block text-brand">
                                Email via Outbound
                            </Link>
                        </div>
                    </aside>

                    <section className="min-h-0 overflow-y-auto p-5">
                        <ActivityTabs
                            tabs={[
                                { key: 'catchup', label: 'Catch-up' },
                                { key: 'activities', label: 'Activities' },
                            ]}
                            active={tab}
                            onChange={setTab}
                        />
                        {tab === 'catchup' ? (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-2 text-[12px] font-semibold uppercase text-muted-foreground">
                                        Recent inbound
                                    </h3>
                                    {inbound.length === 0 ? (
                                        <p className="text-muted-foreground">No inbound yet.</p>
                                    ) : (
                                        inbound.map((item) => (
                                            <p key={item.id} className="py-1">
                                                {item.subject ?? item.body ?? item.type}
                                            </p>
                                        ))
                                    )}
                                </div>
                                <div>
                                    <h3 className="mb-2 text-[12px] font-semibold uppercase text-muted-foreground">
                                        Recent outbound
                                    </h3>
                                    {outbound.length === 0 ? (
                                        <p className="text-muted-foreground">No outbound yet.</p>
                                    ) : (
                                        outbound.map((item) => (
                                            <p key={item.id} className="py-1">
                                                {item.subject ?? item.body ?? item.type}
                                            </p>
                                        ))
                                    )}
                                </div>
                                <Link
                                    href="/crm/deals?create=1"
                                    className="text-[13px] font-medium text-brand"
                                >
                                    Schedule meeting
                                </Link>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {timeline.map((item) => (
                                    <div key={item.id} className="border-l-2 border-brand pl-3">
                                        <p className="text-[11px] uppercase text-muted-foreground">
                                            {item.type}
                                        </p>
                                        <p>{item.subject ?? item.body}</p>
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
                                ))}
                            </div>
                        )}
                    </section>

                    {railOpen ? (
                        <aside className="min-h-0 overflow-y-auto border-l border-hairline p-4">
                            <div className="space-y-3">
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
                                <AssociationCard title="Deals">
                                    {(associations?.deals ?? []).length === 0 ? (
                                        <p className="text-muted-foreground">No deals</p>
                                    ) : (
                                        (associations?.deals ?? []).map((deal) => (
                                            <Link
                                                key={deal.id}
                                                href={`/crm/deals/${deal.id}`}
                                                className="block text-brand"
                                            >
                                                {deal.title}
                                            </Link>
                                        ))
                                    )}
                                </AssociationCard>
                            </div>
                        </aside>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="mb-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    );
}

ContactShow.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Contact', href: '#' },
    ],
};
