import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    currency: string;
    stage_id: number;
    next_activity_at?: string | null;
    contact?: { first_name: string; last_name?: string | null };
    company?: { name: string } | null;
    stage?: { id: number; name: string; slug: string };
};

export default function DealsIndex({
    deals,
    stages,
    contacts,
}: {
    deals: Deal[];
    stages: { id: number; name: string; slug: string; position: number }[];
    contacts: { id: number; first_name: string; last_name?: string | null }[];
}) {
    return (
        <>
            <Head title="Deals" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Deals"
                    description="Default pipeline: New → Qualified → Demo → Proposal → Won / Lost."
                />
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

                <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
                    {stages.map((stage) => {
                        const column = deals.filter((deal) => deal.stage_id === stage.id);
                        return (
                            <Card key={stage.id} className="min-w-[180px] p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-sm font-medium">{stage.name}</h2>
                                    <span className="text-xs text-muted-foreground">{column.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {column.map((deal) => (
                                        <div key={deal.id} className="rounded-md border bg-background p-2 text-sm">
                                            <Link
                                                href={`/crm/deals/${deal.id}`}
                                                className="font-medium text-brand"
                                            >
                                                {deal.title}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {deal.contact?.first_name} {deal.contact?.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {deal.amount_cents} {deal.currency}
                                            </p>
                                            <Form action={`/crm/deals/${deal.id}/move`} method="post" className="mt-2">
                                                <select
                                                    name="stage_id"
                                                    defaultValue={deal.stage_id}
                                                    className="h-8 w-full rounded border bg-background px-1 text-xs"
                                                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                                                >
                                                    {stages.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Form>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Deal</th>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Stage</th>
                                <th className="px-4 py-2">Amount</th>
                                <th className="px-4 py-2">Next activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map((deal) => (
                                <tr key={deal.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <Link href={`/crm/deals/${deal.id}`} className="font-medium text-brand">
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
                                    <td className="px-4 py-2">{deal.next_activity_at ?? '—'}</td>
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
