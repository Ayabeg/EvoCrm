import { Form, Head, Link } from '@inertiajs/react';
import AskEvoPanel from '@/components/crm/ask-evo-panel';
import AssociationsCard from '@/components/crm/associations-card';
import CatchUpBlock from '@/components/crm/catch-up-block';
import DealHealthPill from '@/components/crm/deal-health-pill';
import DealLineItems from '@/components/crm/deal-line-items';
import { formatDzd } from '@/components/crm/hub-chrome';
import RecordActionRow from '@/components/crm/record-action-row';
import { RecordFact, RecordFacts } from '@/components/crm/record-workspace';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DealShow({
    deal,
    associations,
    catchUp,
    products,
    askEvo,
    dealHealth,
}: {
    deal: any;
    associations?: any;
    catchUp?: { inbound?: any[]; outbound?: any[] };
    products?: any[];
    askEvo?: any;
    dealHealth?: any;
}) {
    return (
        <>
            <Head title={deal.title} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={deal.title} description={`Stage: ${deal.stage?.name}`} />
                <RecordFacts>
                    <RecordFact label="Amount">
                        <span className="money">{formatDzd(deal.amount_cents)}</span>
                    </RecordFact>
                    <RecordFact label="Stage">{deal.stage?.name ?? '—'}</RecordFact>
                    <RecordFact label="Contact">
                        <Link href={`/crm/contacts/${deal.contact_id}`} className="text-brand">
                            {deal.contact?.first_name} {deal.contact?.last_name}
                        </Link>
                    </RecordFact>
                    <RecordFact label="Company">{deal.company?.name ?? '—'}</RecordFact>
                </RecordFacts>
                <RecordActionRow
                    dealId={deal.id}
                    contactId={deal.contact_id}
                    companyId={deal.company_id}
                    ownerId={deal.owner_id}
                />
                <DealHealthPill health={dealHealth} />
                <AskEvoPanel action={`/crm/deals/${deal.id}/ask`} insight={askEvo} />
                <CatchUpBlock inbound={catchUp?.inbound} outbound={catchUp?.outbound} />
                <AssociationsCard associations={associations ?? { contact: deal.contact, company: deal.company }} />
                <DealLineItems
                    dealId={deal.id}
                    items={deal.line_items ?? associations?.line_items ?? []}
                    products={products}
                />
                <Card className="space-y-3 p-4 text-sm">
                    <Form action={`/crm/deals/${deal.id}/move`} method="post" className="flex flex-wrap gap-2">
                        {(deal.pipeline?.stages ?? []).map((stage: any) => (
                            <Button key={stage.id} name="stage_id" value={stage.id} variant={stage.id === deal.stage_id ? 'default' : 'secondary'}>
                                {stage.name}
                            </Button>
                        ))}
                    </Form>
                </Card>
                <Card className="p-4">
                    <Form action={`/crm/deals/${deal.id}`} method="put" className="grid gap-3 md:grid-cols-3">
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
                                <div>
                                    <Button disabled={processing}>Save deal</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
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
