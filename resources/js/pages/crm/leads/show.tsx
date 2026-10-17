import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import EnrichmentPanel from '@/components/crm/enrichment-panel';
import type { EnrichmentRunRow } from '@/components/crm/enrichment-panel';
import { InlineRecordField } from '@/components/crm/inline-record-field';
import LeadConversionDialog from '@/components/crm/lead-conversion-dialog';
import LeadEditDialog from '@/components/crm/lead-edit-dialog';
import LeadOwnerDialog from '@/components/crm/lead-owner-dialog';
import LeadScorePill from '@/components/crm/lead-score-pill';
import type { LeadScorePayload } from '@/components/crm/lead-score-pill';
import {
    AssociationCard,
    RecordBack,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordSection,
    RecordStatusBadge,
    formatRecordWhen,
} from '@/components/crm/record-hub';
import { RecordPath } from '@/components/crm/record-path';
import type { PathStep } from '@/components/crm/record-path';
import { RecordIdentity, RecordPageFrame, RecordShell } from '@/evo/crm/record';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';

type LeadContact = {
    id: number;
    first_name?: string;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    phone_e164?: string | null;
    city?: string | null;
    wilaya?: string | null;
    owner_id?: number | null;
    owner?: { id: number; name: string } | null;
};

type Lead = {
    id: number;
    title: string;
    status?: string | null;
    source?: string | null;
    source_detail?: string | null;
    source_campaign?: string | null;
    source_medium?: string | null;
    qualified_at?: string | null;
    contact_id?: number | null;
    score?: number | null;
    contact?: LeadContact | null;
    latest_score?: { reason?: string | null } | null;
};

type PathState = {
    steps: PathStep[];
    current: string;
    next: string | null;
    complete: boolean;
};

type WhatsappPreview = {
    thread_id: number;
    subject?: string | null;
    last_message?: string | null;
    last_message_at?: string | null;
    direction?: string | null;
};

export default function LeadShow({
    lead,
    leadScore,
    path,
    askEvo,
    associations,
    pipelines = [],
    members = [],
    contactDeals = [],
    enrichmentRuns = [],
    enrichAction,
    whatsapp = null,
}: {
    lead: Lead;
    leadScore?: LeadScorePayload | null;
    path: PathState;
    askEvo?: AskEvoPayload | null;
    associations?: {
        contact?: LeadContact | null;
        company?: { id: number; name: string } | null;
        deal?: { id: number; title: string } | null;
        threads?: { id: number; subject?: string | null }[];
        enrollments?: {
            id: number;
            sequence?: { name?: string | null } | null;
        }[];
        deals?: {
            id: number;
            title: string;
            stage?: { name?: string } | string | null;
        }[];
    };
    pipelines?: {
        id: number;
        name: string;
        is_default?: boolean;
        stages: {
            id: number;
            name: string;
            slug: string;
            pipeline_id: number;
        }[];
    }[];
    members?: { id: number; name: string }[];
    contactDeals?: { id: number; title: string; stage?: string | null }[];
    enrichmentRuns?: EnrichmentRunRow[];
    enrichAction?: string;
    whatsapp?: WhatsappPreview | null;
}) {
    const loading = useInertiaLoading();
    const [convertOpen, setConvertOpen] = useState(false);
    const askAction = `/crm/leads/${lead.id}/ask`;
    const leadAction = `/crm/leads/${lead.id}`;
    const contact = associations?.contact ?? lead.contact ?? null;
    const company = associations?.company ?? null;
    const deal = associations?.deal ?? null;
    const threads = associations?.threads ?? [];
    const enrollments = associations?.enrollments ?? [];
    const openDeals = associations?.deals ?? [];
    const contactName = [contact?.first_name, contact?.last_name]
        .filter(Boolean)
        .join(' ');
    const ownerName = contact?.owner?.name ?? null;
    const phone = contact?.phone_e164 || contact?.phone || null;
    const address = [contact?.city, contact?.wilaya].filter(Boolean).join(', ');
    const converted = path.complete || lead.status === 'qualified';
    const contactAction = contact ? `/crm/contacts/${contact.id}` : leadAction;
    const contactExtra = contact
        ? {
              first_name: contact.first_name ?? '',
              last_name: contact.last_name ?? '',
              email: contact.email ?? '',
              phone: contact.phone ?? contact.phone_e164 ?? '',
              owner_id: contact.owner_id ?? contact.owner?.id ?? undefined,
          }
        : {};

    function selectPath(step: string) {
        if (step === 'converted') {
            if (!converted) {
                setConvertOpen(true);
            }

            return;
        }

        if (step === path.current) {
            return;
        }

        router.put(leadAction, { path_step: step }, { preserveScroll: true });
    }

    function markComplete() {
        if (!path.next) {
            return;
        }

        selectPath(path.next);
    }

    return (
        <>
            <Head title={lead.title} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <>
                            <WorkspaceHeader
                                archetype="record"
                                leading={
                                    <RecordBack
                                        href="/crm/leads"
                                        label="Back to Leads"
                                    />
                                }
                                title={
                                    <RecordIdentity
                                        title={lead.title}
                                        kind="Lead"
                                        actionsClassName="sm:max-w-none"
                                        subtitle={
                                            <>
                                                {contactName || 'No contact'}
                                                {lead.source
                                                    ? ` · ${lead.source}`
                                                    : ''}
                                                {ownerName
                                                    ? ` · ${ownerName}`
                                                    : ''}
                                            </>
                                        }
                                        badge={
                                            lead.status ? (
                                                <RecordStatusBadge>
                                                    {lead.status}
                                                </RecordStatusBadge>
                                            ) : null
                                        }
                                        meta={
                                            <LeadScorePill
                                                compact
                                                score={
                                                    leadScore ??
                                                    (typeof lead.score ===
                                                    'number'
                                                        ? {
                                                              score: lead.score,
                                                              reason: lead
                                                                  .latest_score
                                                                  ?.reason,
                                                          }
                                                        : null)
                                                }
                                            />
                                        }
                                        actions={
                                            <div className="flex flex-wrap items-center gap-2">
                                                {converted ? null : (
                                                    <LeadConversionDialog
                                                        leadId={lead.id}
                                                        pipelines={pipelines}
                                                        members={members}
                                                        contactDeals={
                                                            contactDeals
                                                        }
                                                        open={convertOpen}
                                                        onOpenChange={
                                                            setConvertOpen
                                                        }
                                                    />
                                                )}
                                                <LeadOwnerDialog
                                                    leadId={lead.id}
                                                    members={members}
                                                    ownerId={
                                                        contact?.owner_id ??
                                                        contact?.owner?.id
                                                    }
                                                />
                                                <LeadEditDialog
                                                    leadId={lead.id}
                                                    title={lead.title}
                                                    source={lead.source}
                                                    sourceDetail={
                                                        lead.source_detail
                                                    }
                                                    sourceCampaign={
                                                        lead.source_campaign
                                                    }
                                                    sourceMedium={
                                                        lead.source_medium
                                                    }
                                                />
                                                <div className="md:hidden">
                                                    <AskEvoTrigger
                                                        action={askAction}
                                                        insight={askEvo}
                                                    />
                                                </div>
                                            </div>
                                        }
                                    />
                                }
                            />
                            <RecordPath
                                steps={path.steps}
                                current={path.current}
                                disabled={converted}
                                onSelect={selectPath}
                                onComplete={
                                    converted ? undefined : markComplete
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-4">
                                <RecordSection title="About">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Source"
                                            value={lead.source}
                                        />
                                        <RecordFact
                                            label="Lead Status"
                                            value={
                                                path.steps.find(
                                                    (step) =>
                                                        step.key ===
                                                        path.current,
                                                )?.label ?? lead.status
                                            }
                                        />
                                    </RecordFactList>
                                    <div className="space-y-3">
                                        <InlineRecordField
                                            label="Name"
                                            name="first_name"
                                            value={
                                                contact?.first_name ??
                                                contactName
                                            }
                                            action={contactAction}
                                            extra={contactExtra}
                                        />
                                        <p className="min-w-0">
                                            <span className="block text-[11px] text-mute">
                                                Company
                                            </span>
                                            {company ? (
                                                <RelatedRecordLink
                                                    href={`/crm/companies/${company.id}`}
                                                >
                                                    {company.name}
                                                </RelatedRecordLink>
                                            ) : (
                                                <span className="text-[13px] text-ink">
                                                    —
                                                </span>
                                            )}
                                        </p>
                                        <InlineRecordField
                                            label="Title"
                                            name="title"
                                            value={lead.title}
                                            action={leadAction}
                                            extra={{
                                                source: lead.source ?? '',
                                            }}
                                        />
                                        <InlineRecordField
                                            label="Source"
                                            name="source"
                                            value={lead.source}
                                            action={leadAction}
                                            extra={{ title: lead.title }}
                                        />
                                        <p>
                                            <span className="block text-[11px] text-mute">
                                                Lead Status
                                            </span>
                                            <span className="text-[13px] text-ink">
                                                {path.steps.find(
                                                    (step) =>
                                                        step.key ===
                                                        path.current,
                                                )?.label ??
                                                    lead.status ??
                                                    '—'}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="block text-[11px] text-mute">
                                                Lead Owner
                                            </span>
                                            <span className="text-[13px] text-ink">
                                                {ownerName || '—'}
                                            </span>
                                        </p>
                                    </div>
                                </RecordSection>
                                <RecordSection title={t('Attribution')}>
                                    <RecordFactList>
                                        <RecordFact
                                            label={t('Source detail')}
                                            value={lead.source_detail}
                                        />
                                        <RecordFact
                                            label={t('Campaign')}
                                            value={lead.source_campaign}
                                        />
                                        <RecordFact
                                            label={t('Source medium')}
                                            value={lead.source_medium}
                                        />
                                    </RecordFactList>
                                </RecordSection>
                                {leadScore?.breakdown?.length ? (
                                    <RecordSection title={t('Score factors')}>
                                        <div className="space-y-2">
                                            {leadScore.breakdown.map(
                                                (factor) => (
                                                    <div
                                                        key={`${factor.pillar}-${factor.key}`}
                                                        className="flex items-center justify-between gap-3 text-[13px]"
                                                    >
                                                        <span className="min-w-0 text-ink">
                                                            {factor.label}
                                                        </span>
                                                        <span className="shrink-0 font-medium text-ink tabular-nums">
                                                            {factor.points > 0
                                                                ? '+'
                                                                : ''}
                                                            {factor.points}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </RecordSection>
                                ) : null}
                                <RecordSection title="Get in Touch">
                                    <div className="space-y-3">
                                        <InlineRecordField
                                            label="Phone"
                                            name="phone"
                                            value={phone}
                                            action={contactAction}
                                            extra={contactExtra}
                                            type="tel"
                                        />
                                        <InlineRecordField
                                            label="Email"
                                            name="email"
                                            value={contact?.email}
                                            action={contactAction}
                                            extra={contactExtra}
                                            type="email"
                                        />
                                        <p>
                                            <span className="block text-[11px] text-mute">
                                                Address
                                            </span>
                                            <span className="text-[13px] text-ink">
                                                {address || '—'}
                                            </span>
                                        </p>
                                    </div>
                                </RecordSection>
                                {enrichAction ? (
                                    <EnrichmentPanel
                                        action={enrichAction}
                                        runs={enrichmentRuns}
                                    />
                                ) : null}
                            </div>
                        }
                        center={
                            <RecordSection title="Activity">
                                <p className="text-[13px] text-mute">
                                    Open Desk or WhatsApp from the rail to
                                    continue the conversation.
                                </p>
                                <Link
                                    href="/inbox"
                                    className="mt-2 inline-flex text-[13px] font-medium text-ink hover:underline"
                                >
                                    Open in Inbox
                                </Link>
                            </RecordSection>
                        }
                        right={
                            <div className="space-y-3">
                                <AskEvoPanel
                                    action={askAction}
                                    insight={askEvo}
                                />
                                <AssociationCard
                                    title="Desk"
                                    addHref="/inbox"
                                    addLabel="Open"
                                >
                                    {threads.length > 0 ? (
                                        threads.map((thread) => (
                                            <RelatedRecordLink
                                                key={thread.id}
                                                href={`/conversations?thread=${thread.id}`}
                                            >
                                                {thread.subject ??
                                                    `Thread ${thread.id}`}
                                            </RelatedRecordLink>
                                        ))
                                    ) : (
                                        <p className="text-mute">
                                            No Desk thread
                                        </p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="WhatsApp"
                                    addHref={
                                        whatsapp
                                            ? `/conversations?thread=${whatsapp.thread_id}`
                                            : '/inbox'
                                    }
                                    addLabel={whatsapp ? 'Open' : 'Start'}
                                >
                                    {whatsapp?.last_message ? (
                                        <div>
                                            <p className="text-[13px] text-ink">
                                                {whatsapp.last_message}
                                            </p>
                                            <p className="text-[11px] text-mute">
                                                {whatsapp.direction ===
                                                'outbound'
                                                    ? 'Sent'
                                                    : 'Received'}
                                                {whatsapp.last_message_at
                                                    ? ` · ${formatRecordWhen(whatsapp.last_message_at)}`
                                                    : ''}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-mute">
                                            No WhatsApp thread
                                        </p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="Deal"
                                    addHref={
                                        deal
                                            ? `/crm/deals/${deal.id}`
                                            : '/crm/deals?create=1'
                                    }
                                    addLabel={deal ? 'View' : 'Add'}
                                >
                                    {deal ? (
                                        <RelatedRecordLink
                                            href={`/crm/deals/${deal.id}`}
                                        >
                                            {deal.title}
                                        </RelatedRecordLink>
                                    ) : openDeals.length > 0 ? (
                                        openDeals.map((row) => (
                                            <RelatedRecordLink
                                                key={row.id}
                                                href={`/crm/deals/${row.id}`}
                                                meta={
                                                    typeof row.stage ===
                                                    'string'
                                                        ? row.stage
                                                        : row.stage?.name
                                                }
                                            >
                                                {row.title}
                                            </RelatedRecordLink>
                                        ))
                                    ) : (
                                        <p className="text-mute">
                                            {t('No deal')}
                                        </p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="Contact"
                                    addHref={
                                        lead.contact_id
                                            ? `/crm/contacts/${lead.contact_id}`
                                            : '/crm/contacts?create=1'
                                    }
                                    addLabel={lead.contact_id ? 'View' : 'Add'}
                                >
                                    {contact && lead.contact_id ? (
                                        <RelatedRecordLink
                                            href={`/crm/contacts/${lead.contact_id}`}
                                        >
                                            {contactName || 'Contact'}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">
                                            {t('No contact')}
                                        </p>
                                    )}
                                </AssociationCard>
                                <AssociationCard title="Company">
                                    {company ? (
                                        <RelatedRecordLink
                                            href={`/crm/companies/${company.id}`}
                                        >
                                            {company.name}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">
                                            {t('No company')}
                                        </p>
                                    )}
                                </AssociationCard>
                                {enrollments.length > 0 ? (
                                    <AssociationCard title="Enrollments">
                                        {enrollments.map((enrollment) => (
                                            <p
                                                key={enrollment.id}
                                                className="text-[13px] text-ink"
                                            >
                                                {enrollment.sequence?.name ??
                                                    `Enrollment ${enrollment.id}`}
                                            </p>
                                        ))}
                                    </AssociationCard>
                                ) : null}
                            </div>
                        }
                    />
                </RecordPageFrame>
            )}
        </>
    );
}

LeadShow.layout = {
    breadcrumbs: [
        { title: 'Leads', href: '/crm/leads' },
        { title: 'Lead', href: '#' },
    ],
};
