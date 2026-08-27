import { Form, Head, Link } from '@inertiajs/react';
import EnrichmentPanel from '@/components/crm/enrichment-panel';
import type { EnrichmentRunRow } from '@/components/crm/enrichment-panel';
import LeadConversionDialog from '@/components/crm/lead-conversion-dialog';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LeadShow({
    lead,
    associations,
    pipelines = [],
    members = [],
    contactDeals = [],
    enrichmentRuns = [],
    enrichAction,
}: {
    lead: any;
    associations?: any;
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
    return (
        <>
            <Head title={lead.title} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={lead.title} description={`Status: ${lead.status}`}>
                    <Link href="/inbox" className="rounded bg-brand px-3 py-1 text-sm text-canvas">
                        Open in Inbox
                    </Link>
                    {lead.status !== 'qualified' ? (
                        <LeadConversionDialog
                            leadId={lead.id}
                            pipelines={pipelines}
                            members={members}
                            contactDeals={contactDeals}
                        />
                    ) : null}
                </PageHeader>
                <Card className="space-y-2 p-4 text-sm">
                    <p>
                        Contact:{' '}
                        <Link href={`/crm/contacts/${lead.contact_id}`} className="text-brand">
                            {lead.contact?.first_name} {lead.contact?.last_name}
                        </Link>
                    </p>
                    <p>Source: {lead.source ?? '—'}</p>
                    <p>Qualified at: {lead.qualified_at ?? '—'}</p>
                </Card>
                <Card className="p-4">
                    <Form action={`/crm/leads/${lead.id}`} method="put" className="grid gap-3 md:grid-cols-3">
                        {({ processing }) => (
                            <>
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <input
                                        name="title"
                                        defaultValue={lead.title}
                                        required
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Source</label>
                                    <input
                                        name="source"
                                        defaultValue={lead.source ?? ''}
                                        className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Save lead</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="space-y-2 p-4 text-sm">
                    <h2 className="font-medium">Associations</h2>
                    {associations?.contact ? (
                        <Link href={`/crm/contacts/${associations.contact.id}`} className="block text-brand">
                            Contact · {associations.contact.first_name} {associations.contact.last_name}
                        </Link>
                    ) : null}
                    {associations?.company ? (
                        <Link href={`/crm/companies/${associations.company.id}`} className="block text-brand">
                            Company · {associations.company.name}
                        </Link>
                    ) : null}
                    {associations?.deal ? (
                        <Link href={`/crm/deals/${associations.deal.id}`} className="block text-brand">
                            Deal · {associations.deal.title}
                        </Link>
                    ) : null}
                    {(associations?.threads ?? []).map((thread: any) => (
                        <Link key={thread.id} href={`/conversations?thread=${thread.id}`} className="block text-brand">
                            Desk history · {thread.subject ?? thread.id}
                        </Link>
                    ))}
                    {(associations?.enrollments ?? []).map((enrollment: any) => (
                        <p key={enrollment.id}>Enrollment · {enrollment.sequence?.name ?? enrollment.id}</p>
                    ))}
                </Card>
                {enrichAction ? (
                    <EnrichmentPanel action={enrichAction} runs={enrichmentRuns} />
                ) : null}
            </div>
        </>
    );
}

LeadShow.layout = {
    breadcrumbs: [
        { title: 'Leads', href: '/crm/leads' },
        { title: 'Lead', href: '#' },
    ],
};
