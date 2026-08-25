import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import type {AskEvoPayload} from '@/components/crm/ask-evo-panel';
import CatchUpBlock from '@/components/crm/catch-up-block';
import type {CatchUpItem} from '@/components/crm/catch-up-block';
import ContactDealsKanban from '@/components/crm/contact-deals-kanban';
import { SkeletonRecord } from '@/components/crm/empty-room';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
} from '@/components/crm/record-chrome';
import RecordProperties from '@/components/crm/record-properties';
import type {AttributeBag} from '@/components/crm/record-properties';
import { Avatar, AvatarFallback } from '@/components/ui/aurora/avatar';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { formatContactName } from '@/lib/contact-name';

type Contact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    display_name?: string;
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

type DealKanban = {
    pipeline: { id: number; name: string };
    stages: { id: number; name: string; slug: string }[];
    deals: { id: number; title: string; amount_cents: number; stage_id: number }[];
};

export default function ContactShow({
    contact,
    associations,
    timeline,
    attributes,
    askEvo,
    contactEngagement,
    proactiveSummary,
    catchUp,
    dealsKanban,
}: {
    contact: Contact;
    associations: {
        company?: { id: number; name: string } | null;
        deals?: { id: number; title: string; stage?: { name: string } }[];
    } | null;
    timeline: Activity[];
    attributes?: AttributeBag;
    askEvo?: AskEvoPayload | null;
    contactEngagement?: { score: number; label: string; reason: string } | null;
    proactiveSummary?: string | null;
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    dealsKanban?: DealKanban | null;
}) {
    const [tab, setTab] = useState('catchup');
    const loading = useInertiaLoading();
    const name =
        contact.display_name ??
        formatContactName(contact.first_name, contact.last_name);

    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();

    const activityItems = useMemo(() => {
        if (tab === 'catchup') {
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
            <Head title={name} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <div className="flex h-app-workspace flex-col bg-canvas-soft text-ui text-ink">
                    <div className="shrink-0 border-b border-hairline bg-canvas px-4 py-4 sm:px-6 sm:py-5">
                        <RecordBack href="/crm/contacts" label="Back to Contacts" />
                        <div className="mt-4 flex items-start gap-3">
                            <Avatar size="lg" className="shrink-0">
                                <AvatarFallback className="bg-ink text-[13px] font-medium text-canvas sm:text-[12px]">
                                    {initials || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-1">
                                <h1 className="text-record-title font-semibold leading-snug">{name}</h1>
                                <p className="text-[13px] leading-relaxed text-muted-foreground">
                                    {contact.company?.name ?? 'No company'}
                                </p>
                                {contact.email ? (
                                    <p className="truncate text-[13px] text-muted-foreground">{contact.email}</p>
                                ) : null}
                                {contactEngagement ? (
                                    <p className="pt-1 text-[12px] leading-relaxed text-muted-foreground">
                                        <span className="font-medium text-ink">
                                            {contactEngagement.label}
                                        </span>{' '}
                                        ({contactEngagement.score}/100)
                                        <span className="hidden sm:inline"> · {contactEngagement.reason}</span>
                                    </p>
                                ) : null}
                                <div className="pt-3">
                                    <RecordActions
                                        entityId={contact.id}
                                        contactId={contact.id}
                                        companyId={contact.company_id}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <RecordShell
                        left={
                            <div className="space-y-5">
                                <AskEvoPanel
                                    action={`/crm/contacts/${contact.id}/ask`}
                                    insight={askEvo}
                                />
                                {proactiveSummary ? (
                                    <p className="rounded border border-hairline bg-canvas-soft px-3 py-2 text-[12px] text-muted-foreground">
                                        {proactiveSummary}
                                    </p>
                                ) : null}
                                <h2 className="text-[13px] font-semibold">Key information</h2>
                                <Field label="Email" value={contact.email ?? '—'} />
                                <Field label="Phone" value={contact.phone_e164 ?? '—'} />
                                <Field label="Lead status" value={contact.lead_status ?? '—'} />
                                <Field
                                    label="Create date"
                                    value={
                                        contact.created_at
                                            ? String(contact.created_at).slice(0, 10)
                                            : '—'
                                    }
                                />
                                {attributes ? (
                                    <RecordProperties
                                        action={`/crm/contacts/${contact.id}/attributes`}
                                        attributes={attributes}
                                    />
                                ) : null}
                            </div>
                        }
                        center={
                            <div className="space-y-5">
                                <ActivityTabs
                                    tabs={[
                                        { key: 'catchup', label: 'Catch-up' },
                                        { key: 'activities', label: 'All' },
                                        { key: 'notes', label: 'Notes' },
                                        { key: 'emails', label: 'Emails' },
                                        { key: 'calls', label: 'Calls' },
                                        { key: 'tasks', label: 'Tasks' },
                                        { key: 'meetings', label: 'Meetings' },
                                    ]}
                                    active={tab}
                                    onChange={setTab}
                                />
                                {tab === 'catchup' ? (
                                    catchUp ? (
                                        <CatchUpBlock
                                                inbound={catchUp.inbound}
                                                outbound={catchUp.outbound}
                                            />
                                    ) : (
                                        <p className="text-muted-foreground">
                                            No catch-up items yet.
                                        </p>
                                    )
                                ) : (
                                    <div className="space-y-4">
                                        {activityItems.length === 0 ? (
                                            <p className="text-muted-foreground">
                                                No activity yet.
                                            </p>
                                        ) : (
                                            activityItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="border-l-2 border-brand pl-3"
                                                >
                                                    <p className="text-section-label text-muted-foreground">
                                                        {item.type}
                                                    </p>
                                                    <p className="font-medium">
                                                        {item.subject ?? item.body}
                                                    </p>
                                                    {item.type === 'task' && !item.done ? (
                                                        <Form
                                                            action={`/crm/activities/${item.id}/complete`}
                                                            method="post"
                                                            options={{ preserveScroll: true }}
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
                                )}
                            </div>
                        }
                        right={
                            <div className="space-y-4">
                                {dealsKanban ? (
                                    <ContactDealsKanban
                                        pipelineName={dealsKanban.pipeline.name}
                                        stages={dealsKanban.stages}
                                        deals={dealsKanban.deals}
                                        contactId={contact.id}
                                    />
                                ) : null}
                                <AssociationCard
                                    title="Companies"
                                    addHref={
                                        associations?.company
                                            ? `/crm/companies/${associations.company.id}`
                                            : '/crm/companies?create=1'
                                    }
                                    addLabel={associations?.company ? 'View' : 'Add'}
                                >
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
                                <AssociationCard
                                    title="Deals"
                                    addHref={`/crm/deals?create=1&contact_id=${contact.id}`}
                                >
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
                                                {deal.stage ? ` · ${deal.stage.name}` : ''}
                                            </Link>
                                        ))
                                    )}
                                </AssociationCard>
                            </div>
                        }
                    />
                </div>
            )}
        </>
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

ContactShow.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Contact', href: '#' },
    ],
};
