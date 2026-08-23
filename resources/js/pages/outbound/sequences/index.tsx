import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SequencesIndex({ sequences }: { sequences: any[] }) {
    return (
        <>
            <Head title="Sequences" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Sequences"
                    description="Quiet hours (Africa/Algiers) and suppression apply before every automated send."
                />
                <Card className="p-4">
                    <Form action="/outbound/sequences" method="post" className="grid gap-3 md:grid-cols-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required />
                                </div>
                                <div>
                                    <Label>Channel</Label>
                                    <select name="channel" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="email">Email SMTP</option>
                                        <option value="whatsapp_cloud">WhatsApp Cloud template</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>Create</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Sequence</th>
                                <th className="px-4 py-2">Channel</th>
                                <th className="px-4 py-2">Steps</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sequences.map((sequence) => (
                                <tr key={sequence.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <Link href={`/outbound/sequences/${sequence.id}`} className="text-brand">
                                            {sequence.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{sequence.channel}</td>
                                    <td className="px-4 py-2">{sequence.steps?.length ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}

SequencesIndex.layout = {
    breadcrumbs: [{ title: 'Sequences', href: '/outbound/sequences' }],
};
