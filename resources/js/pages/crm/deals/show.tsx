import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
                        Amount: {deal.amount_cents} {deal.currency}
                    </p>
                    <Form action={`/crm/deals/${deal.id}/move`} method="post" className="flex flex-wrap gap-2">
                        {(deal.pipeline?.stages ?? []).map((stage: any) => (
                            <Button key={stage.id} name="stage_id" value={stage.id} variant={stage.id === deal.stage_id ? 'default' : 'secondary'}>
                                {stage.name}
                            </Button>
                        ))}
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
