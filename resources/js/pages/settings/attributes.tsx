import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AttributeSettings({ definitions }: { definitions: any[] }) {
    return (
        <>
            <Head title="Custom attributes" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">Custom attributes</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Workspace-defined fields on Contact, Company, and Deal. Analog to Chatwoot custom attributes — not copied from Chatwoot.
                    </p>
                </div>
                <Card className="p-4">
                    <Form action="/settings/attributes" method="post" className="grid gap-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label>Entity</Label>
                                    <select name="entity" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="contact">Contact</option>
                                        <option value="company">Company</option>
                                        <option value="deal">Deal</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Key</Label>
                                    <Input name="key" required placeholder="sector" />
                                </div>
                                <div>
                                    <Label>Label</Label>
                                    <Input name="label" required placeholder="Sector" />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <select name="type" className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                        <option value="text">text</option>
                                        <option value="number">number</option>
                                        <option value="list">list</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>List options (comma)</Label>
                                    <Input name="options" placeholder="santé, logistique, retail" />
                                </div>
                                <Button disabled={processing}>Save definition</Button>
                            </>
                        )}
                    </Form>
                </Card>
                <div className="space-y-2 text-sm">
                    {definitions.map((definition) => (
                        <Card key={definition.id} className="p-3">
                            <p className="font-medium">{definition.label}</p>
                            <p className="text-muted-foreground">
                                {definition.entity} · {definition.key} · {definition.type}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

AttributeSettings.layout = {
    breadcrumbs: [{ title: 'Custom attributes', href: '/settings/attributes' }],
};
