import { Form, Head, router } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SuppressionsIndex({
    items,
}: {
    items: {
        id: number;
        type: string;
        value: string;
        reason?: string | null;
        source?: string | null;
    }[];
}) {
    return (
        <>
            <Head title="Suppression" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Suppressions"
                    description="Suppressed emails and phones never receive automated outbound — sequences skip them, campaigns fail them honestly, and the public unsubscribe link lands here."
                />
                <Card className="p-4">
                    <Form
                        action="/outbound/suppressions"
                        method="post"
                        className="grid gap-3 md:grid-cols-4"
                        resetOnSuccess
                    >
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Type</Label>
                                    <select
                                        name="type"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    >
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Value</Label>
                                    <Input name="value" required />
                                </div>
                                <div>
                                    <Label>Reason</Label>
                                    <Input
                                        name="reason"
                                        defaultValue="manual"
                                    />
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
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Value</th>
                                <th className="px-4 py-2">Reason</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-4 py-2">{item.type}</td>
                                    <td className="px-4 py-2">{item.value}</td>
                                    <td className="px-4 py-2">
                                        {item.reason ?? '—'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-brand"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        `Remove ${item.value} from the suppression list?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        `/outbound/suppressions/${item.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            Remove
                                        </Button>
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

SuppressionsIndex.layout = {
    breadcrumbs: [{ title: 'Suppression', href: '/outbound/suppressions' }],
};
