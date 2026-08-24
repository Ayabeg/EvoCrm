import { Form, Head, Link } from '@inertiajs/react';
import AssociationsCard from '@/components/crm/associations-card';
import CatchUpBlock from '@/components/crm/catch-up-block';
import RecordActionRow from '@/components/crm/record-action-row';
import { RecordFact, RecordTimeline, RecordWorkspace } from '@/components/crm/record-workspace';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DealShow({
    deal,
    associations,
    catchUp,
    timeline = [],
}: {
    deal: any;
    associations?: any;
    catchUp?: { inbound?: any[]; outbound?: any[] };
    timeline?: any[];
}) {
    return (
        <>
            <Head title={deal.title} />
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-hairline px-6 pt-6">
                    <PageHeader title={deal.title} description={`Stage: ${deal.stage?.name}`} />
                </div>
                <RecordWorkspace
                    facts={
                        <>
                            <div className="space-y-4">
                                <RecordFact label="Contact">
                                    <Link href={`/crm/contacts/${deal.contact_id}`} className="text-brand">
                                        {deal.contact?.first_name} {deal.contact?.last_name}
                                    </Link>
                                </RecordFact>
                                <RecordFact label="Company">{deal.company?.name ?? '—'}</RecordFact>
                                <RecordFact label="Stage">{deal.stage?.name ?? '—'}</RecordFact>
                            </div>
                            <RecordActionRow
                                dealId={deal.id}
                                contactId={deal.contact_id}
                                companyId={deal.company_id}
                                ownerId={deal.owner_id}
                            />
                            <Form action={`/crm/deals/${deal.id}/move`} method="post" className="flex flex-wrap gap-2">
                                {(deal.pipeline?.stages ?? []).map((stage: any) => (
                                    <Button key={stage.id} name="stage_id" value={stage.id} variant={stage.id === deal.stage_id ? 'default' : 'secondary'}>
                                        {stage.name}
                                    </Button>
                                ))}
                            </Form>
                            <Form action={`/crm/deals/${deal.id}`} method="put" className="grid gap-3 border-t border-hairline pt-6">
                                {({ processing }) => (
                                    <>
                                        <div>
                                            <Label>Title</Label>
                                            <Input name="title" defaultValue={deal.title} required />
                                        </div>
                                        <div>
                                            <Label>Amount (cents DZD)</Label>
                                            <Input name="amount_cents" type="number" min={0} defaultValue={deal.amount_cents} />
                                        </div>
                                        <div>
                                            <Label>Next activity</Label>
                                            <Input
                                                name="next_activity_at"
                                                type="datetime-local"
                                                defaultValue={deal.next_activity_at ? String(deal.next_activity_at).slice(0, 16) : ''}
                                            />
                                        </div>
                                        <Button disabled={processing}>Save deal</Button>
                                    </>
                                )}
                            </Form>
                        </>
                    }
                    center={
                        <>
                            <CatchUpBlock inbound={catchUp?.inbound} outbound={catchUp?.outbound} />
                            <RecordTimeline timeline={timeline} />
                        </>
                    }
                    associations={<AssociationsCard associations={associations ?? { contact: deal.contact, company: deal.company }} />}
                />
            </div>
        </>
    );
}

DealShow.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Deal', href: '#' },
    ],
};
