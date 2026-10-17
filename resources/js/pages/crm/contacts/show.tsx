import { Head } from '@inertiajs/react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import type { CatchUpItem } from '@/components/crm/catch-up-block';
import DeskThreadCard from '@/components/crm/desk-thread-card';
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
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordSection,
    RecordStatusBadge,
} from '@/components/crm/record-hub';
import RecordProperties from '@/components/crm/record-properties';
import type { AttributeBag } from '@/components/crm/record-properties';
import TicketsRelatedCard from '@/components/crm/tickets-related-card';
import type { TicketsRelated } from '@/components/crm/tickets-related-card';
import { RecordIdentity, RecordPageFrame, RecordShell } from '@/evo/crm/record';
import { formatPhone } from '@/evo/lib/format';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';

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
    source?: string | null;
    source_detail?: string | null;
    source_campaign?: string | null;
    source_medium?: string | null;
    first_touch_at?: string | null;
    last_touch_at?: string | null;
};

type ContactConsent = {
    id: number;
    channel: string;
    purpose: string;
    status: string;
    granted: boolean;
    source?: string | null;
};

type ContactRelationship = {
    id: number;
    direction: string;
    relationship_type: string;
    label?: string | null;
    href?: string | null;
};

export default function ContactShow({
    contact,
    associations,
    timeline,
    attributes,
    askEvo,
    contactEngagement,
    catchUp,
    playbooks,
    consents = [],
    relationships = [],
    enrichmentRuns = [],
    enrichAction,
}: {
    contact: Contact;
    associations: {
        company?: { id: number; name: string } | null;
        deals?: { id: number; title: string; stage?: { name: string } }[];
        threads?: {
            id: number;
            subject?: string | null;
            last_message?: string | null;
            last_message_at?: string | null;
        }[];
        tickets?: TicketsRelated;
    } | null;
    timeline: RecordActivity[];
    attributes?: AttributeBag;
    askEvo?: AskEvoPayload | null;
    contactEngagement?: { score: number; label: string; reason: string } | null;
    proactiveSummary?: string | null;
    catchUp?: { inbound?: CatchUpItem[]; outbound?: CatchUpItem[] } | null;
    consents?: ContactConsent[];
    relationships?: ContactRelationship[];
    dealsKanban?: {
        pipeline: { id: number; name: string };
        stages: { id: number; name: string; slug: string }[];
        deals: {
            id: number;
            title: string;
            amount_cents: number;
            stage_id: number;
        }[];
    } | null;
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
    const thread = associations?.threads?.[0] ?? null;
    const inbound = catchUp?.inbound?.[0];

    return (
        <>
            <Head title={name} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <div
                    className="contact-record flex min-h-0 flex-1 flex-col"
                    data-crm="contacts-record"
                >
                    <RecordPageFrame
                        header={
                            <WorkspaceHeader
                                archetype="record"
                                leading={
                                    <RecordBack
                                        href="/crm/contacts"
                                        label={t('Back to Contacts')}
                                    />
                                }
                                title={
                                    <RecordIdentity
                                        title={name}
                                        kind="Contact"
                                        subtitle={
                                            company?.name ?? t('No company')
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
                                                <p className="text-[12px] leading-snug text-[var(--evo-ink-secondary)]">
                                                    <span className="font-medium text-[var(--evo-ink)]">
                                                        {
                                                            contactEngagement.label
                                                        }
                                                    </span>{' '}
                                                    ({contactEngagement.score}
                                                    /100)
                                                    <span className="hidden sm:inline">
                                                        {' '}
                                                        ·{' '}
                                                        {
                                                            contactEngagement.reason
                                                        }
                                                    </span>
                                                </p>
                                            ) : null
                                        }
                                        actions={
                                            <RecordActions
                                                entityId={contact.id}
                                                contactId={contact.id}
                                                companyId={contact.company_id}
                                                whatsappHref={
                                                    thread
                                                        ? `/conversations?thread=${thread.id}`
                                                        : '/inbox'
                                                }
                                            />
                                        }
                                    />
                                }
                                panels={
                                    <div className="md:hidden">
                                        <AskEvoTrigger
                                            action={askAction}
                                            insight={askEvo}
                                        />
                                    </div>
                                }
                            />
                        }
                    >
                        <RecordShell
                            leftLabel={t('About')}
                            centerLabel={t('Activity')}
                            rightLabel={t('Related')}
                            leftClassName="bg-white"
                            centerClassName="bg-white"
                            rightClassName="bg-white"
                            left={
                                <div className="space-y-5">
                                    <RecordSection
                                        title={t('About this contact')}
                                    >
                                        <RecordFactList>
                                            <RecordFact
                                                label="Email"
                                                value={contact.email}
                                            />
                                            <RecordFact
                                                label="Phone"
                                                value={
                                                    contact.phone_e164
                                                        ? formatPhone(
                                                              contact.phone_e164,
                                                          )
                                                        : null
                                                }
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
                                                label="Source"
                                                value={contact.source}
                                            />
                                            <RecordFact
                                                label="Campaign"
                                                value={contact.source_campaign}
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
                                    <RecordSection
                                        title={t('Attribution details')}
                                    >
                                        <RecordFactList>
                                            <RecordFact
                                                label="Source detail"
                                                value={contact.source_detail}
                                            />
                                            <RecordFact
                                                label="Source medium"
                                                value={contact.source_medium}
                                            />
                                            <RecordFact
                                                label="First touch"
                                                value={contact.first_touch_at?.slice(
                                                    0,
                                                    10,
                                                )}
                                            />
                                            <RecordFact
                                                label="Last touch"
                                                value={contact.last_touch_at?.slice(
                                                    0,
                                                    10,
                                                )}
                                            />
                                        </RecordFactList>
                                    </RecordSection>
                                    <RecordSection
                                        title={t('Communication consent')}
                                    >
                                        {consents.length === 0 ? (
                                            <p className="text-[13px] text-mute">
                                                {t('No consent record yet')}
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {consents.map((consent) => (
                                                    <div
                                                        key={consent.id}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] text-ink">
                                                                {
                                                                    consent.channel
                                                                }{' '}
                                                                ·{' '}
                                                                {
                                                                    consent.purpose
                                                                }
                                                            </p>
                                                            <p className="text-[11px] text-mute">
                                                                {consent.source ??
                                                                    t(
                                                                        'Source not recorded',
                                                                    )}
                                                            </p>
                                                        </div>
                                                        <RecordStatusBadge>
                                                            {consent.granted
                                                                ? t('Granted')
                                                                : t(
                                                                      consent.status,
                                                                  )}
                                                        </RecordStatusBadge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </RecordSection>
                                    {enrichAction ? (
                                        <EnrichmentPanel
                                            action={enrichAction}
                                            runs={enrichmentRuns}
                                        />
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
                                    insight={askEvo}
                                    contactId={contact.id}
                                    companyId={contact.company_id}
                                />
                            }
                            right={
                                <div className="space-y-4">
                                    <AskEvoPanel
                                        action={askAction}
                                        insight={askEvo}
                                    />
                                    <DeskThreadCard
                                        thread={
                                            inbound
                                                ? {
                                                      id: thread?.id,
                                                      subject: inbound.label,
                                                      last_message:
                                                          inbound.label,
                                                  }
                                                : thread
                                        }
                                    />
                                    <AssociationCard
                                        title={t('Company')}
                                        addHref={
                                            company
                                                ? `/crm/companies/${company.id}`
                                                : '/crm/companies?create=1'
                                        }
                                        addLabel={
                                            company ? t('View') : t('Add')
                                        }
                                    >
                                        {company ? (
                                            <RelatedRecordLink
                                                href={`/crm/companies/${company.id}`}
                                            >
                                                {company.name}
                                            </RelatedRecordLink>
                                        ) : (
                                            <p className="text-mute">
                                                {t('No company linked')}
                                            </p>
                                        )}
                                    </AssociationCard>
                                    <AssociationCard
                                        title={t('Deals')}
                                        addHref={`/crm/deals?create=1&contact_id=${contact.id}`}
                                    >
                                        {deals.length === 0 ? (
                                            <p className="text-mute">
                                                {t('No deals yet')}
                                            </p>
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
                                    <AssociationCard title={t('Relationships')}>
                                        {relationships.length === 0 ? (
                                            <p className="text-mute">
                                                {t('No relationships yet')}
                                            </p>
                                        ) : (
                                            relationships.map(
                                                (relationship) => (
                                                    <RelatedRecordLink
                                                        key={relationship.id}
                                                        href={
                                                            relationship.href ??
                                                            '#'
                                                        }
                                                        meta={
                                                            relationship.relationship_type
                                                        }
                                                    >
                                                        {relationship.label ??
                                                            t('Unknown record')}
                                                    </RelatedRecordLink>
                                                ),
                                            )
                                        )}
                                    </AssociationCard>
                                    <TicketsRelatedCard
                                        tickets={associations?.tickets}
                                        addHref={`/crm/tickets?create=1&contact_id=${contact.id}`}
                                    />
                                </div>
                            }
                        />
                    </RecordPageFrame>
                </div>
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
