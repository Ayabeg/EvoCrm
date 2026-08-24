import { Form, Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Segment = {
    id: number;
    name: string;
    entity: 'contact' | 'deal';
    filters: Record<string, unknown>;
    count: number;
};

export default function SegmentsIndex({
    segments,
    tab = 'manage',
}: {
    segments: Segment[];
    tab?: string;
}) {
    return (
        <>
            <Head title="Segments" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Segments"
                    description="Named filters for contacts and deals. Manage saved lists without changing the existing CRM hubs."
                />
                <div className="flex gap-1">
                    <span className="rounded bg-ink px-2 py-1 text-[11px] text-canvas">Manage</span>
                </div>
                {tab === 'manage' ? (
                    <>
                        <Card className="p-4">
                            <Form action="/crm/segments" method="post" className="grid gap-3 md:grid-cols-4" resetOnSuccess>
                                {({ processing }) => (
                                    <>
                                        <div>
                                            <Label>Name</Label>
                                            <Input name="name" required />
                                        </div>
                                        <div>
                                            <Label>Object type</Label>
                                            <select name="entity" className="h-9 w-full rounded-md border bg-background px-2 text-sm" defaultValue="contact">
                                                <option value="contact">Contact</option>
                                                <option value="deal">Deal</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Filter JSON</Label>
                                            <Input name="filters_json" placeholder='{"owner":"1","status":"open"}' />
                                        </div>
                                        <div className="flex items-end">
                                            <Button disabled={processing}>Save segment</Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </Card>
                        <Card className="overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-left">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Object</th>
                                        <th className="px-4 py-2">Count</th>
                                        <th className="px-4 py-2">Filters</th>
                                        <th className="px-4 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map((segment) => (
                                        <tr key={segment.id} className="border-t">
                                            <td className="px-4 py-2 font-medium">{segment.name}</td>
                                            <td className="px-4 py-2 capitalize">{segment.entity}</td>
                                            <td className="px-4 py-2 tabular-nums">{segment.count}</td>
                                            <td className="px-4 py-2 text-[11px] text-mute">
                                                {JSON.stringify(segment.filters)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Form action={`/crm/segments/${segment.id}`} method="delete">
                                                    <Button variant="secondary" className="h-7 text-[11px]">
                                                        Delete
                                                    </Button>
                                                </Form>
                                            </td>
                                        </tr>
                                    ))}
                                    {segments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-mute">
                                                No segments yet.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </Card>
                    </>
                ) : null}
            </div>
        </>
    );
}

SegmentsIndex.layout = {
    breadcrumbs: [{ title: 'Segments', href: '/crm/segments' }],
};
