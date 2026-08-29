import { Head } from '@inertiajs/react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import ContactDealsKanban from '@/components/crm/contact-deals-kanban';
import { SkeletonRecord } from '@/components/crm/empty-room';
import EnrichmentPanel from '@/components/crm/enrichment-panel';
import type { EnrichmentRunRow } from '@/components/crm/enrichment-panel';
import PlaybookCard from '@/components/crm/playbook-card';
import type { RecordActivity } from '@/components/crm/record-activity';
import RecordActivityPanel from '@/components/crm/record-activity-panel';
import {
    AssociationCard,
    RecordActions,
    RecordBack,
    RecordShell,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordIdentity,
    RecordPageFrame,
    RecordSection,
    RecordStatusBadge,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
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
    owner?: { id: number; name: string } | null;
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
    enrichmentRuns = [],
    enrichAction,
}: {
    contact: Contact;
    associations: {
        company?: { id: number; name: string } | null;
        deals?: { id: number; title: string; stage?: { name: string } }[];
    } | null;
    timeline: RecordActivity[];
    attributes?: AttributeBag;
    askEvo?: AskEvoPayload | null;
    contactEngagement?: { score: number; label: string; reason: string } | null;
    proactiveSummary?: string | null;
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    dealsKanban?: DealKanban | null;
    playbooks?: Array<{ id: number; name: string; body: string }>;
    enrichmentRuns?: EnrichmentRunRow[];
    enrichAction?: string;
}) {
    const loading = useInertiaLoading();
    const name =
        contact.display_name ??
        formatContactName(contact.first_name, contact.last_name);
    const askAction = `/crm/contacts/${contact.id}/ask`;
    const company = associations?.company ?? contact.company ?? null;
    const deals = associations?.deals ?? [];

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
                                kind="Contact"
                                subtitle={
                                    <>
                                        {company?.name ?? 'No company'}
                                        {contact.owner?.name
                                            ? ` · ${contact.owner.name}`
                                            : ''}
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
                                        <p className="text-[11px] leading-snug text-mute">
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
                                        secondary={
                                            <div className="md:hidden">
                                                <AskEvoTrigger
                                                    action={askAction}
                                                    insight={askEvo}
                                                />
                                            </div>
                                        }
                                    />
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-3">
                                <RecordSection title="Contact information">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Email"
                                            value={contact.email}
                                        />
                                        <RecordFact
                                            label="Phone"
                                            value={contact.phone_e164}
                                        />
                                        <RecordFact
                                            label="Company"
                                            value={company?.name}
                                        />
                                        <RecordFact
                                            label="Owner"
                                            value={contact.owner?.name}
                                        />
                                        <RecordFact
                                            label="Lead status"
                                            value={contact.lead_status}
                                        />
                                        <RecordFact
                                            label="Created"
                                            value={
                                                contact.created_at
                                                    ? String(
                                                          contact.created_at,
                                                      ).slice(0, 10)
                                                    : null
                                            }
                                        />
                                    </RecordFactList>
                                </RecordSection>
                                {enrichAction ? (
                                    <EnrichmentPanel
                                        action={enrichAction}
                                        runs={enrichmentRuns}
                                    />
                                ) : null}
                                {proactiveSummary ? (
                                    <p className="text-[12px] leading-relaxed text-mute">
                                        {proactiveSummary}
                                    </p>
                                ) : null}
                                <PlaybookCard playbooks={playbooks} />
                                {attributes ? (
                                    <RecordProperties
                                        action={`/crm/contacts/${contact.id}/attributes`}
                                        attributes={attributes}
                                    />
                                ) : null}
                            </div>
                        }
                        center={
                            <RecordActivityPanel
                                timeline={timeline}
                                catchUp={catchUp}
                            />
                        }
                        right={
                            <div className="space-y-3">
                                <AssociationCard
                                    title="Company"
                                    addHref={
                                        company
                                            ? `/crm/companies/${company.id}`
                                            : '/crm/companies?create=1'
                                    }
                                    addLabel={company ? 'View' : 'Add'}
                                >
                                    {company ? (
                                        <RelatedRecordLink
                                            href={`/crm/companies/${company.id}`}
                                        >
                                            {company.name}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">No company</p>
                                    )}
                                </AssociationCard>
                                {dealsKanban ? (
                                    <ContactDealsKanban
                                        pipelineName={dealsKanban.pipeline.name}
                                        stages={dealsKanban.stages}
                                        deals={dealsKanban.deals}
                                        contactId={contact.id}
                                    />
                                ) : (
                                    <AssociationCard
                                        title="Deals"
                                        addHref={`/crm/deals?create=1&contact_id=${contact.id}`}
                                    >
                                        {deals.length === 0 ? (
                                            <p className="text-mute">No deals</p>
                                        ) : (
                                            deals.map((deal) => (
                                                <RelatedRecordLink
                                                    key={deal.id}
                                                    href={`/crm/deals/${deal.id}`}
                                                    meta={deal.stage?.name}
                                                >
                                                    {deal.title}
                                                </RelatedRecordLink>
                                            ))
                                        )}
                                    </AssociationCard>
                                )}
                                <AskEvoPanel
                                    action={askAction}
                                    insight={askEvo}
                                />
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
