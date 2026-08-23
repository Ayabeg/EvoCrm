import { Form, Head, Link, router } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SequenceRow = {
    id: number;
    name: string;
    channel: string;
    active: boolean;
    description?: string | null;
    steps: { id: number }[];
    enrollments_count: number;
    enrollments_active: number;
    enrollments_paused: number;
    enrollments_finished: number;
};

export default function SequencesIndex({ sequences }: { sequences: SequenceRow[] }) {
    return (
        <>
            <Head title="Sequences" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Sequences"
                    description="Email steps with {{variables}}. Quiet hours (Africa/Algiers) defer sends; suppression cancels enrollment. WhatsApp steps use official Cloud templates only."
                />
                <Card className="p-4">
                    <Form action="/outbound/sequences" method="post" className="grid gap-3 md:grid-cols-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" required placeholder="Clinic email nurture" />
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
                                <th className="px-4 py-2">Enrolled</th>
                                <th className="px-4 py-2">Active</th>
                                <th className="px-4 py-2">Paused</th>
                                <th className="px-4 py-2">Finished</th>
                                <th className="px-4 py-2">State</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sequences.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                                        No sequences yet.
                                    </td>
                                </tr>
                            ) : (
                                sequences.map((sequence) => (
                                    <tr key={sequence.id} className="border-t border-hairline">
                                        <td className="px-4 py-2">
                                            <Link href={`/outbound/sequences/${sequence.id}`} className="font-medium text-brand">
                                                {sequence.name}
                                            </Link>
                                            {sequence.description ? (
                                                <p className="text-xs text-muted-foreground">{sequence.description}</p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-2">{sequence.channel}</td>
                                        <td className="px-4 py-2">{sequence.steps?.length ?? 0}</td>
                                        <td className="px-4 py-2">{sequence.enrollments_count}</td>
                                        <td className="px-4 py-2">{sequence.enrollments_active}</td>
                                        <td className="px-4 py-2">{sequence.enrollments_paused}</td>
                                        <td className="px-4 py-2">{sequence.enrollments_finished}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={sequence.active ? 'default' : 'outline'}>
                                                {sequence.active ? 'active' : 'draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.post(`/outbound/sequences/${sequence.id}/toggle`)}
                                            >
                                                {sequence.active ? 'Pause' : 'Activate'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
