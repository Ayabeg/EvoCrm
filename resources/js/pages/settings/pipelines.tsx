import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PipelineRow = {
    id: number;
    name: string;
    is_default: boolean;
    stages_count: number;
    deals_count: number;
};

export default function PipelineSettings({
    pipelines,
    canManage,
}: {
    pipelines: PipelineRow[];
    canManage: boolean;
}) {
    return (
        <>
            <Head title="Pipelines" />
            <div className="space-y-6">
                <Heading
                    title="Deal pipelines"
                    description="Multiple pipelines for different sales motions. Each pipeline gets the standard Evotechly stages (New → Lost) with forecast probabilities."
                />

                {canManage ? (
                    <Card className="space-y-3 p-4">
                        <h2 className="text-sm font-semibold">Add pipeline</h2>
                        <Form action="/settings/pipelines" method="post" className="grid gap-3 md:grid-cols-3">
                            <div>
                                <Label htmlFor="pipeline-name">Name</Label>
                                <Input id="pipeline-name" name="name" required placeholder="Enterprise" className="mt-1" />
                            </div>
                            <label className="flex items-end gap-2 pb-2 text-sm">
                                <input type="checkbox" name="is_default" value="1" />
                                Set as default
                            </label>
                            <div className="flex items-end">
                                <Button type="submit">Create pipeline</Button>
                            </div>
                        </Form>
                    </Card>
                ) : null}

                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Pipeline</th>
                                <th className="px-4 py-2">Stages</th>
                                <th className="px-4 py-2">Deals</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pipelines.map((pipeline) => (
                                <tr key={pipeline.id} className="border-t">
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{pipeline.name}</span>
                                            {pipeline.is_default ? <Badge variant="secondary">Default</Badge> : null}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">{pipeline.stages_count}</td>
                                    <td className="px-4 py-2">{pipeline.deals_count}</td>
                                    <td className="px-4 py-2">
                                        {canManage ? (
                                            <div className="flex flex-wrap gap-2">
                                                {!pipeline.is_default ? (
                                                    <Form
                                                        action={`/settings/pipelines/${pipeline.id}`}
                                                        method="post"
                                                        className="inline"
                                                    >
                                                        <input type="hidden" name="_method" value="patch" />
                                                        <input type="hidden" name="is_default" value="1" />
                                                        <Button type="submit" variant="secondary" size="sm">
                                                            Make default
                                                        </Button>
                                                    </Form>
                                                ) : null}
                                                {!pipeline.is_default && pipeline.deals_count === 0 ? (
                                                    <Form
                                                        action={`/settings/pipelines/${pipeline.id}`}
                                                        method="post"
                                                        className="inline"
                                                    >
                                                        <input type="hidden" name="_method" value="delete" />
                                                        <Button type="submit" variant="secondary" size="sm">
                                                            Delete
                                                        </Button>
                                                    </Form>
                                                ) : null}
                                            </div>
                                        ) : (
                                            '—'
                                        )}
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

PipelineSettings.layout = {
    breadcrumbs: [{ title: 'Pipelines', href: '/settings/pipelines' }],
};
