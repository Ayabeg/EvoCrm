import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DealShow({ deal }: { deal: any }) {
    return (
        <>
            <Head title={deal.title} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader title={deal.title} description={`Stage: ${deal.stage?.name}`} />
                <Card className="space-y-3 p-4 text-sm">
                    <p>
                        Contact:{' '}
                        <Link href={`/crm/contacts/${deal.contact_id}`} className="text-teal-700 dark:text-teal-300">
                            {deal.contact?.first_name} {deal.contact?.last_name}
                        </Link>
                    </p>
                    <p>
                        Company: {deal.company?.name ?? '—'}
                    </p>
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
