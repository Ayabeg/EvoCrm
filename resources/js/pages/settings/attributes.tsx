import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FillRate = {
    filled: number;
    total: number;
    percent: number;
};

type Definition = {
    id: number;
    entity: string;
    key: string;
    label: string;
    type: string;
    options?: string[] | null;
    group?: string | null;
    required?: boolean;
    fill_rate?: FillRate;
};

const entities = [
    { value: 'contact', label: 'Contact' },
    { value: 'deal', label: 'Deal' },
    { value: 'company', label: 'Company' },
] as const;

const types = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
] as const;

export default function AttributeSettings({ definitions }: { definitions: Definition[] }) {
    const [type, setType] = useState('text');

    const byEntity = entities
        .map((entity) => ({
            ...entity,
            items: definitions.filter((definition) => definition.entity === entity.value),
        }))
        .filter((entity) => entity.items.length > 0);

    return (
        <>
            <Head title="Attributes" />
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Attributes"
                    description="Workspace-defined fields for contacts and deals. Values live on each record as an extra section — existing fields stay as they are."
                />

                <Card className="border-hairline bg-canvas p-4">
                    <h2 className="mb-1 font-medium text-ink">New attribute</h2>
                    <p className="mb-3 text-sm text-mute">
                        Type, group, and required flag apply to every record of that entity.
                    </p>
                    <Form action="/settings/attributes" method="post" className="grid gap-3" resetOnSuccess>
                        {({ processing }) => (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="entity">Entity</Label>
                                        <select
                                            id="entity"
                                            name="entity"
                                            className="mt-1 h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink"
                                        >
                                            {entities.map((entity) => (
                                                <option key={entity.value} value={entity.value}>
                                                    {entity.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="type">Type</Label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={type}
                                            onChange={(event) => setType(event.target.value)}
                                            className="mt-1 h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink"
                                        >
                                            {types.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="key">Key</Label>
                                        <Input id="key" name="key" required placeholder="beds" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="label">Label</Label>
                                        <Input id="label" name="label" required placeholder="Beds" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="group">Group</Label>
                                        <Input id="group" name="group" placeholder="About" className="mt-1" />
                                    </div>
                                    {type === 'select' ? (
                                        <div>
                                            <Label htmlFor="options">Select options (comma)</Label>
                                            <Input
                                                id="options"
                                                name="options"
                                                placeholder="santé, logistique, retail"
                                                className="mt-1"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <label className="flex items-center gap-2 text-sm text-ink">
                                    <input
                                        type="checkbox"
                                        name="required"
                                        value="1"
                                        className="size-4 accent-brand"
                                    />
                                    Required on the record
                                </label>
                                <Button disabled={processing}>Save definition</Button>
                            </>
                        )}
                    </Form>
                </Card>

                <div className="space-y-4">
                    {byEntity.length === 0 ? (
                        <p className="text-sm text-mute">No attributes yet. Start with Contact.</p>
                    ) : (
                        byEntity.map((entity) => (
                            <div key={entity.value} className="space-y-2">
                                <h2 className="text-sm font-semibold text-ink">{entity.label}</h2>
                                {entity.items.map((definition) => (
                                    <Card key={definition.id} className="border-hairline bg-canvas p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-ink">{definition.label}</p>
                                                <p className="text-sm text-mute">
                                                    {definition.key} · {definition.group || 'General'}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline">{definition.type}</Badge>
                                                {definition.required ? (
                                                    <Badge className="border-transparent bg-brand/10 text-brand">
                                                        required
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                        {definition.fill_rate ? (
                                            <div className="mt-3 space-y-1">
                                                <div className="flex items-center justify-between text-[11px] text-mute">
                                                    <span>Fill rate</span>
                                                    <span>
                                                        {definition.fill_rate.filled} / {definition.fill_rate.total} ·{' '}
                                                        {definition.fill_rate.percent}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                                                    <div
                                                        className="h-full bg-brand"
                                                        style={{ width: `${definition.fill_rate.percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                        {definition.options && definition.options.length > 0 ? (
                                            <p className="mt-2 text-[11px] text-mute">
                                                {definition.options.join(' · ')}
                                            </p>
                                        ) : null}
                                    </Card>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

AttributeSettings.layout = {
    breadcrumbs: [{ title: 'Attributes', href: '/settings/attributes' }],
};
