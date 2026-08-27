import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import CatchUpBlock from '@/components/crm/catch-up-block';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import ContactDealsKanban from '@/components/crm/contact-deals-kanban';
import { SkeletonRecord } from '@/components/crm/empty-room';
import PlaybookCard from '@/components/crm/playbook-card';
import {
    ActivityTabs,
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordIdentity,
    RecordPageFrame,
    RecordSection,
    RecordStatusBadge,
    RecordTimelineItem,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
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
    deals: {
        id: number;
        title: string;
        amount_cents: number;
        stage_id: number;
    }[];
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
    playbooks,
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
    playbooks?: Array<{ id: number; name: string; body: string }>;
}) {
    const [tab, setTab] = useState('catchup');
    const loading = useInertiaLoading();
    const name =
        contact.display_name ??
        formatContactName(contact.first_name, contact.last_name);

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
                <RecordPageFrame
                    header={
                        <>
                            <RecordBack
                                href="/crm/contacts"
                                label="Back to Contacts"
                            />
                            <RecordIdentity
                                title={name}
                                subtitle={
                                    <>
                                        <p>
                                            {contact.company?.name ??
                                                'No company'}
                                        </p>
                                        {contact.email ? (
                                            <p className="truncate">
                                                {contact.email}
                                            </p>
                                        ) : null}
                                    </>
                                }
                                badge={
                                    contact.lead_status ? (
                                        <RecordStatusBadge>
                                            {contact.lead_status}
                                        </RecordStatusBadge>
                                    ) : null
                                }
                                meta={
                                    contactEngagement ? (
                                        <p className="pt-1 text-[12px] leading-relaxed text-mute">
                                            <span className="font-medium text-ink">
                                                {contactEngagement.label}
                                            </span>{' '}
                                            ({contactEngagement.score}/100)
                                            <span className="hidden sm:inline">
                                                {' '}
                                                · {contactEngagement.reason}
                                            </span>
                                        </p>
                                    ) : null
                                }
                                actions={
                                    <RecordActions
                                        entityId={contact.id}
                                        contactId={contact.id}
                                        companyId={contact.company_id}
                                    />
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-4">
                                <AskEvoPanel
                                    action={`/crm/contacts/${contact.id}/ask`}
                                    insight={askEvo}
                                />
                                <PlaybookCard playbooks={playbooks} />
                                {proactiveSummary ? (
                                    <p className="rounded-xl border border-hairline bg-canvas-soft px-3 py-2 text-[12px] text-mute">
                                        {proactiveSummary}
                                    </p>
                                ) : null}
                                <RecordSection title="Key information">
                                    <RecordFact
                                        label="Email"
                                        value={contact.email ?? '—'}
                                    />
                                    <RecordFact
                                        label="Phone"
                                        value={contact.phone_e164 ?? '—'}
                                    />
                                    <RecordFact
                                        label="Lead status"
                                        value={contact.lead_status ?? '—'}
                                    />
                                    <RecordFact
                                        label="Create date"
                                        value={
                                            contact.created_at
                                                ? String(
                                                      contact.created_at,
                                                  ).slice(0, 10)
                                                : '—'
                                        }
                                    />
                                </RecordSection>
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
                                        <p className="text-mute">
                                            No catch-up items yet.
                                        </p>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        {activityItems.length === 0 ? (
                                            <p className="text-mute">
                                                No activity yet.
                                            </p>
                                        ) : (
                                            activityItems.map((item) => (
                                                <RecordTimelineItem
                                                    key={item.id}
                                                    type={item.type}
                                                    title={
                                                        item.subject ??
                                                        item.body
                                                    }
                                                >
                                                    {item.type === 'task' &&
                                                    !item.done ? (
                                                        <Form
                                                            action={`/crm/activities/${item.id}/complete`}
                                                            method="post"
                                                            options={{
                                                                preserveScroll: true,
                                                            }}
                                                        >
                                                            <Button
                                                                variant="secondary"
                                                                className="mt-1 h-6 text-[11px]"
                                                            >
                                                                Done
                                                            </Button>
                                                        </Form>
                                                    ) : null}
                                                </RecordTimelineItem>
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
                                    addLabel={
                                        associations?.company ? 'View' : 'Add'
                                    }
                                >
                                    {associations?.company ? (
                                        <Link
                                            href={`/crm/companies/${associations.company.id}`}
                                            className="text-brand"
                                        >
                                            {associations.company.name}
                                        </Link>
                                    ) : (
                                        <p className="text-mute">No company</p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="Deals"
                                    addHref={`/crm/deals?create=1&contact_id=${contact.id}`}
                                >
                                    {(associations?.deals ?? []).length ===
                                    0 ? (
                                        <p className="text-mute">No deals</p>
                                    ) : (
                                        (associations?.deals ?? []).map(
                                            (deal) => (
                                                <Link
                                                    key={deal.id}
                                                    href={`/crm/deals/${deal.id}`}
                                                    className="block text-brand"
                                                >
                                                    {deal.title}
                                                    {deal.stage
                                                        ? ` · ${deal.stage.name}`
                                                        : ''}
                                                </Link>
                                            ),
                                        )
                                    )}
                                </AssociationCard>
                            </div>
                        }
                    />
                </RecordPageFrame>
            )}
        </>
    );
}

ContactShow.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Contact', href: '#' },
    ],
};
