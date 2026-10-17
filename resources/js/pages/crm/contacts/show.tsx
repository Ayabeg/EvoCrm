import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
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
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
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
    phone?: string | null;
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
    expires_at?: string | null;
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
    companies = [],
    members = [],
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
    companies?: { id: number; name: string }[];
    members?: { id: number; name: string }[];
}) {
    const loading = useInertiaLoading();
    const [editing, setEditing] = useState(false);
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
                                                secondary={
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        aria-expanded={editing}
                                                        onClick={() =>
                                                            setEditing(
                                                                (open) => !open,
                                                            )
                                                        }
                                                    >
                                                        {editing
                                                            ? t('Close edit')
                                                            : t('Edit')}
                                                    </Button>
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
                                    {editing ? (
                                        <RecordSection
                                            title={t('Edit contact')}
                                        >
                                            <Form
                                                action={`/crm/contacts/${contact.id}`}
                                                method="put"
                                                className="space-y-2"
                                            >
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="mb-1 block text-[12px]">
                                                            {t('First name')}
                                                        </Label>
                                                        <Input
                                                            name="first_name"
                                                            defaultValue={
                                                                contact.first_name
                                                            }
                                                            required
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="mb-1 block text-[12px]">
                                                            {t('Last name')}
                                                        </Label>
                                                        <Input
                                                            name="last_name"
                                                            defaultValue={
                                                                contact.last_name ??
                                                                ''
                                                            }
                                                            className="h-8"
                                                        />
                                                    </div>
                                                </div>
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    defaultValue={
                                                        contact.email ?? ''
                                                    }
                                                    placeholder={t('Email')}
                                                    className="h-8"
                                                />
                                                <Input
                                                    name="phone"
                                                    defaultValue={
                                                        contact.phone ??
                                                        contact.phone_e164 ??
                                                        ''
                                                    }
                                                    placeholder={t('Phone')}
                                                    className="h-8"
                                                />
                                                <select
                                                    name="company_id"
                                                    defaultValue={
                                                        contact.company_id ?? ''
                                                    }
                                                    className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                                >
                                                    <option value="">
                                                        {t('No company')}
                                                    </option>
                                                    {companies.map(
                                                        (companyOption) => (
                                                            <option
                                                                key={
                                                                    companyOption.id
                                                                }
                                                                value={
                                                                    companyOption.id
                                                                }
                                                            >
                                                                {
                                                                    companyOption.name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <select
                                                    name="owner_id"
                                                    defaultValue={
                                                        contact.owner?.id ?? ''
                                                    }
                                                    className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                                >
                                                    <option value="">
                                                        {t('Unassigned')}
                                                    </option>
                                                    {members.map((member) => (
                                                        <option
                                                            key={member.id}
                                                            value={member.id}
                                                        >
                                                            {member.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    name="lead_status"
                                                    defaultValue={
                                                        contact.lead_status ??
                                                        ''
                                                    }
                                                    className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                                >
                                                    <option value="">
                                                        {t('No lead status')}
                                                    </option>
                                                    <option value="new">
                                                        {t('New')}
                                                    </option>
                                                    <option value="open">
                                                        {t('Open')}
                                                    </option>
                                                    <option value="qualified">
                                                        {t('Qualified')}
                                                    </option>
                                                    <option value="unqualified">
                                                        {t('Unqualified')}
                                                    </option>
                                                </select>
                                                <select
                                                    name="source"
                                                    defaultValue={
                                                        contact.source ?? ''
                                                    }
                                                    className="h-8 w-full rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                                                >
                                                    <option value="">
                                                        {t('Unknown source')}
                                                    </option>
                                                    <option value="website">
                                                        {t('Website')}
                                                    </option>
                                                    <option value="referral">
                                                        {t('Referral')}
                                                    </option>
                                                    <option value="facebook">
                                                        Facebook
                                                    </option>
                                                    <option value="instagram">
                                                        Instagram
                                                    </option>
                                                    <option value="whatsapp">
                                                        WhatsApp
                                                    </option>
                                                    <option value="phone">
                                                        {t('Phone')}
                                                    </option>
                                                    <option value="event">
                                                        {t('Event')}
                                                    </option>
                                                    <option value="partner">
                                                        {t('Partner')}
                                                    </option>
                                                    <option value="import">
                                                        {t('Import')}
                                                    </option>
                                                    <option value="other">
                                                        {t('Other')}
                                                    </option>
                                                </select>
                                                <Input
                                                    name="source_detail"
                                                    defaultValue={
                                                        contact.source_detail ??
                                                        ''
                                                    }
                                                    placeholder={t(
                                                        'Source detail',
                                                    )}
                                                    className="h-8"
                                                />
                                                <Input
                                                    name="source_campaign"
                                                    defaultValue={
                                                        contact.source_campaign ??
                                                        ''
                                                    }
                                                    placeholder={t('Campaign')}
                                                    className="h-8"
                                                />
                                                <Input
                                                    name="source_medium"
                                                    defaultValue={
                                                        contact.source_medium ??
                                                        ''
                                                    }
                                                    placeholder={t(
                                                        'Source medium',
                                                    )}
                                                    className="h-8"
                                                />
                                                <Button className="h-8">
                                                    {t('Save contact')}
                                                </Button>
                                            </Form>
                                        </RecordSection>
                                    ) : null}
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
                                                                {consent.expires_at
                                                                    ? ' · ' +
                                                                      t(
                                                                          'Expires',
                                                                      ) +
                                                                      ' ' +
                                                                      consent.expires_at.slice(
                                                                          0,
                                                                          10,
                                                                      )
                                                                    : ''}
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
                                        <Form
                                            action={
                                                '/crm/contacts/' +
                                                contact.id +
                                                '/consent'
                                            }
                                            method="post"
                                            className="space-y-2 border-t border-hairline pt-3"
                                        >
                                            <p className="text-[12px] font-medium text-ink">
                                                {t('Record or update consent')}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    name="channel"
                                                    defaultValue="email"
                                                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
                                                >
                                                    <option value="email">
                                                        {t('Email')}
                                                    </option>
                                                    <option value="whatsapp">
                                                        WhatsApp
                                                    </option>
                                                    <option value="sms">
                                                        SMS
                                                    </option>
                                                </select>
                                                <select
                                                    name="status"
                                                    defaultValue="granted"
                                                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[12px]"
                                                >
                                                    <option value="granted">
                                                        {t('Granted')}
                                                    </option>
                                                    <option value="denied">
                                                        {t('Denied')}
                                                    </option>
                                                    <option value="unknown">
                                                        {t('Unknown')}
                                                    </option>
                                                </select>
                                            </div>
                                            <Input
                                                name="source"
                                                placeholder={t(
                                                    'Consent source',
                                                )}
                                                className="h-8"
                                            />
                                            <Input
                                                name="expires_at"
                                                type="date"
                                                className="h-8"
                                            />
                                            <Button size="sm">
                                                {t('Save consent')}
                                            </Button>
                                        </Form>
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
