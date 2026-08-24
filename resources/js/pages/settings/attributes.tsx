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
    { value: 'list', label: 'List' },
] as const;

function TypeFields({
    idPrefix,
    defaultType,
    defaultOptions,
}: {
    idPrefix: string;
    defaultType: string;
    defaultOptions?: string[] | null;
}) {
    const initial = defaultType === 'select' ? 'list' : defaultType;
    const [type, setType] = useState(initial);

    return (
        <>
            <div>
                <Label htmlFor={`${idPrefix}-type`}>Type</Label>
                <select
                    id={`${idPrefix}-type`}
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
            {type === 'list' ? (
                <div>
                    <Label htmlFor={`${idPrefix}-options`}>List options (comma)</Label>
                    <Input
                        id={`${idPrefix}-options`}
                        name="options"
                        defaultValue={(defaultOptions ?? []).join(', ')}
                        placeholder="santé, logistique, retail"
                        className="mt-1"
                    />
                </div>
            ) : null}
        </>
    );
}

function DefinitionCard({ definition }: { definition: Definition }) {
    return (
        <Card className="border-hairline bg-canvas p-3">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-medium text-ink">{definition.label}</p>
                    <p className="text-sm text-mute">
                        {definition.entity} · {definition.key} · {definition.group || 'General'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{definition.type}</Badge>
                    {definition.required ? (
                        <Badge className="border-transparent bg-brand/10 text-brand">required</Badge>
                    ) : null}
                </div>
            </div>

            {definition.fill_rate ? (
                <div className="mb-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-mute">
                        <span>Fill rate</span>
                        <span>
                            {definition.fill_rate.filled} / {definition.fill_rate.total} · {definition.fill_rate.percent}%
                        </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                        <div className="h-full bg-brand" style={{ width: `${definition.fill_rate.percent}%` }} />
                    </div>
                </div>
            ) : null}

            <Form
                action={`/settings/attributes/${definition.id}`}
                method="put"
                className="grid gap-3"
            >
                {({ processing }) => (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <Label htmlFor={`label-${definition.id}`}>Label</Label>
                                <Input
                                    id={`label-${definition.id}`}
                                    name="label"
                                    defaultValue={definition.label}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor={`group-${definition.id}`}>Group</Label>
                                <Input
                                    id={`group-${definition.id}`}
                                    name="group"
                                    defaultValue={definition.group ?? ''}
                                    placeholder="About"
                                    className="mt-1"
                                />
                            </div>
                            <TypeFields
                                idPrefix={`edit-${definition.id}`}
                                defaultType={definition.type}
                                defaultOptions={definition.options}
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-ink">
                            <input
                                type="checkbox"
                                name="required"
                                value="1"
                                defaultChecked={Boolean(definition.required)}
                                className="size-4 accent-brand"
                            />
                            Required on the record
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <Button disabled={processing}>Save changes</Button>
                        </div>
                    </>
                )}
            </Form>
            <Form action={`/settings/attributes/${definition.id}`} method="delete" className="mt-2">
                {({ processing }) => (
                    <Button type="submit" variant="secondary" className="h-8" disabled={processing}>
                        Delete
                    </Button>
                )}
            </Form>
        </Card>
    );
}

export default function AttributeSettings({ definitions }: { definitions: Definition[] }) {
    const byEntity = entities
        .map((entity) => ({
            ...entity,
            items: definitions.filter((definition) => definition.entity === entity.value),
        }))
        .filter((entity) => entity.items.length > 0);

    return (
        <>
            <Head title="Custom attributes" />
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Custom attributes"
                    description="Workspace-defined fields on Contact, Company, and Deal. Add a date or list, group them, then edit or delete the definition."
                />

                <Card className="border-hairline bg-canvas p-4">
                    <h2 className="mb-1 font-medium text-ink">New attribute</h2>
                    <p className="mb-3 text-sm text-mute">
                        Values are stored per record and shown on the contact or deal hub.
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
                                    <TypeFields idPrefix="create" defaultType="text" />
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
                                    <DefinitionCard key={definition.id} definition={definition} />
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
    breadcrumbs: [{ title: 'Custom attributes', href: '/settings/attributes' }],
};
