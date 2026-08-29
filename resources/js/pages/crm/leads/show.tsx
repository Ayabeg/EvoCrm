import { Form, Head, Link } from '@inertiajs/react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import EnrichmentPanel from '@/components/crm/enrichment-panel';
import type { EnrichmentRunRow } from '@/components/crm/enrichment-panel';
import LeadConversionDialog from '@/components/crm/lead-conversion-dialog';
import LeadScorePill from '@/components/crm/lead-score-pill';
import type { LeadScorePayload } from '@/components/crm/lead-score-pill';
import {
    AssociationCard,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';

type Lead = {
    id: number;
    title: string;
    status?: string | null;
    source?: string | null;
    qualified_at?: string | null;
    contact_id?: number | null;
    score?: number | null;
    contact?: { first_name?: string; last_name?: string | null } | null;
    latest_score?: { reason?: string | null } | null;
};

export default function LeadShow({
    lead,
    leadScore,
    askEvo,
    associations,
    pipelines = [],
    members = [],
    contactDeals = [],
    enrichmentRuns = [],
    enrichAction,
}: {
    lead: Lead;
    leadScore?: LeadScorePayload | null;
    askEvo?: AskEvoPayload | null;
    associations?: {
        contact?: { id: number; first_name?: string; last_name?: string | null } | null;
        company?: { id: number; name: string } | null;
        deal?: { id: number; title: string } | null;
        threads?: { id: number; subject?: string | null }[];
        enrollments?: { id: number; sequence?: { name?: string | null } | null }[];
    };
    pipelines?: {
        id: number;
        name: string;
        is_default?: boolean;
        stages: { id: number; name: string; slug: string; pipeline_id: number }[];
    }[];
    members?: { id: number; name: string }[];
    contactDeals?: { id: number; title: string; stage?: string | null }[];
    enrichmentRuns?: EnrichmentRunRow[];
    enrichAction?: string;
}) {
    const loading = useInertiaLoading();
    const askAction = `/crm/leads/${lead.id}/ask`;
    const contact = associations?.contact ?? lead.contact ?? null;
    const company = associations?.company ?? null;
    const deal = associations?.deal ?? null;
    const threads = associations?.threads ?? [];
    const enrollments = associations?.enrollments ?? [];
    const contactName = [contact?.first_name, contact?.last_name]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <Head title={lead.title} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <>
                            <RecordBack href="/crm/leads" label="Back to Leads" />
                            <RecordIdentity
                                title={lead.title}
                                kind="Lead"
                                subtitle={
                                    <>
                                        {contactName || 'No contact'}
                                        {lead.source ? ` · ${lead.source}` : ''}
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
                                            (typeof lead.score === 'number'
                                                ? {
                                                      score: lead.score,
                                                      reason: lead.latest_score
                                                          ?.reason,
                                                  }
                                                : null)
                                        }
                                    />
                                }
                                actions={
                                    <div className="flex flex-wrap items-center gap-2">
                                        {lead.status !== 'qualified' ? (
                                            <LeadConversionDialog
                                                leadId={lead.id}
                                                pipelines={pipelines}
                                                members={members}
                                                contactDeals={contactDeals}
                                            />
                                        ) : null}
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href="/inbox">Open in Inbox</Link>
                                        </Button>
                                        <div className="md:hidden">
                                            <AskEvoTrigger
                                                action={askAction}
                                                insight={askEvo}
                                            />
                                        </div>
                                    </div>
                                }
                            />
                        </>
                    }
                >
                    <RecordShell
                        left={
                            <div className="space-y-3">
                                <RecordSection title="Lead information">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Contact"
                                            value={contactName || null}
                                        />
                                        <RecordFact
                                            label="Source"
                                            value={lead.source}
                                        />
                                        <RecordFact
                                            label="Status"
                                            value={lead.status}
                                        />
                                        <RecordFact
                                            label="Qualified"
                                            value={
                                                lead.qualified_at
                                                    ? String(lead.qualified_at).slice(
                                                          0,
                                                          10,
                                                      )
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
                            </div>
                        }
                        center={
                            <RecordSection title="Edit lead">
                                <Form
                                    action={`/crm/leads/${lead.id}`}
                                    method="put"
                                    className="grid gap-2 sm:grid-cols-2"
                                >
                                    {({ processing }) => (
                                        <>
                                            <div>
                                                <label className="mb-1 block text-[11px] text-mute">
                                                    Title
                                                </label>
                                                <Input
                                                    name="title"
                                                    defaultValue={lead.title}
                                                    required
                                                    className="h-8"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[11px] text-mute">
                                                    Source
                                                </label>
                                                <Input
                                                    name="source"
                                                    defaultValue={lead.source ?? ''}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8"
                                                    disabled={processing}
                                                >
                                                    Save lead
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </RecordSection>
                        }
                        right={
                            <div className="space-y-3">
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
                                        <p className="text-mute">No contact</p>
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
                                        <p className="text-mute">No company</p>
                                    )}
                                </AssociationCard>
                                <AssociationCard title="Deal">
                                    {deal ? (
                                        <RelatedRecordLink
                                            href={`/crm/deals/${deal.id}`}
                                        >
                                            {deal.title}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">No deal</p>
                                    )}
                                </AssociationCard>
                                {threads.length > 0 ? (
                                    <AssociationCard title="Desk">
                                        {threads.map((thread) => (
                                            <RelatedRecordLink
                                                key={thread.id}
                                                href={`/conversations?thread=${thread.id}`}
                                            >
                                                {thread.subject ?? `Thread ${thread.id}`}
                                            </RelatedRecordLink>
                                        ))}
                                    </AssociationCard>
                                ) : null}
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

LeadShow.layout = {
    breadcrumbs: [
        { title: 'Leads', href: '/crm/leads' },
        { title: 'Lead', href: '#' },
    ],
};
