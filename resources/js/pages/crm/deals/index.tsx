import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DealsIndex({
    deals,
    stages,
    contacts,
}: {
    deals: any[];
    stages: any[];
    contacts: any[];
}) {
    return (
        <>
            <Head title="Deals" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Deals"
                    description="Default pipeline: New → Qualified → Demo → Proposal → Won / Lost."
                />
                <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                        <span key={stage.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                            {stage.position}. {stage.name}
                        </span>
                    ))}
                </div>
                <Card className="p-4">
                    <Form action="/crm/deals" method="post" className="grid gap-3 md:grid-cols-4" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Title</Label>
                                    <Input name="title" required />
                                </div>
                                <div>
                                    <Label>Contact</Label>
                                    <select name="contact_id" className="h-9 w-full rounded-md border bg-background px-2 text-sm" required>
                                        <option value="">Select</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.first_name} {contact.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Amount (cents DZD)</Label>
                                    <Input name="amount_cents" type="number" min={0} />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Add</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Deal</th>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Stage</th>
                                <th className="px-4 py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => (
                                <tr key={deal.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <Link href={`/crm/deals/${deal.id}`} className="font-medium text-teal-700 dark:text-teal-300">
                                            {deal.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">
                                        {deal.contact?.first_name} {deal.contact?.last_name}
                                    </td>
                                    <td className="px-4 py-2">{deal.stage?.name}</td>
                                    <td className="px-4 py-2">
                                        {deal.amount_cents} {deal.currency}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

DealsIndex.layout = {
    breadcrumbs: [{ title: 'Deals', href: '/crm/deals' }],
};
