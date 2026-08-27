import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

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
                <Label htmlFor={`${idPrefix}-type`} className="mb-1 block">
                    Type
                </Label>
                <NativeSelect
                    id={`${idPrefix}-type`}
                    name="type"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                >
                    {types.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </NativeSelect>
            </div>
            {type === 'list' ? (
                <div>
                    <Label htmlFor={`${idPrefix}-options`} className="mb-1 block">
                        List options (comma)
                    </Label>
                    <Input
                        id={`${idPrefix}-options`}
                        name="options"
                        defaultValue={(defaultOptions ?? []).join(', ')}
                        placeholder="santé, logistique, retail"
                    />
                </div>
            ) : null}
        </>
    );
}

function DefinitionForm({
    definition,
    onDone,
}: {
    definition?: Definition;
    onDone: () => void;
}) {
    const isEdit = Boolean(definition);

    return (
        <Form
            action={
                isEdit
                    ? `/settings/attributes/${definition!.id}`
                    : '/settings/attributes'
            }
            method={isEdit ? 'put' : 'post'}
            className="space-y-3"
            resetOnSuccess={!isEdit}
            onSuccess={onDone}
        >
            {({ processing }) => (
                <>
                    {!isEdit ? (
                        <div>
                            <Label htmlFor="entity" className="mb-1 block">
                                Entity
                            </Label>
                            <NativeSelect id="entity" name="entity">
                                {entities.map((entity) => (
                                    <option key={entity.value} value={entity.value}>
                                        {entity.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                    ) : null}

                    {!isEdit ? (
                        <div>
                            <Label htmlFor="key" className="mb-1 block">
                                Key
                            </Label>
                            <Input id="key" name="key" required placeholder="beds" />
                        </div>
                    ) : null}

                    <div>
                        <Label
                            htmlFor={isEdit ? `label-${definition!.id}` : 'label'}
                            className="mb-1 block"
                        >
                            Label
                        </Label>
                        <Input
                            id={isEdit ? `label-${definition!.id}` : 'label'}
                            name="label"
                            defaultValue={definition?.label}
                            required
                            placeholder="Beds"
                        />
                    </div>

                    <div>
                        <Label
                            htmlFor={isEdit ? `group-${definition!.id}` : 'group'}
                            className="mb-1 block"
                        >
                            Group
                        </Label>
                        <Input
                            id={isEdit ? `group-${definition!.id}` : 'group'}
                            name="group"
                            defaultValue={definition?.group ?? ''}
                            placeholder="About"
                        />
                    </div>

                    <TypeFields
                        idPrefix={isEdit ? `edit-${definition!.id}` : 'create'}
                        defaultType={definition?.type ?? 'text'}
                        defaultOptions={definition?.options}
                    />

                    <label className="flex items-center gap-2 aurora-text-body-sm text-ink">
                        <input
                            type="checkbox"
                            name="required"
                            value="1"
                            defaultChecked={Boolean(definition?.required)}
                            className="size-4 accent-brand"
                        />
                        Required on the record
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onDone}>
                            Cancel
                        </Button>
                        <Button disabled={processing}>
                            {isEdit ? 'Save changes' : 'Save definition'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

export default function AttributeSettings({
    definitions,
}: {
    definitions: Definition[];
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Definition | null>(null);

    const byEntity = entities
        .map((entity) => ({
            ...entity,
            items: definitions.filter(
                (definition) => definition.entity === entity.value,
            ),
        }))
        .filter((entity) => entity.items.length > 0);

    return (
        <>
            <Head title="Custom attributes" />

            <div className="space-y-5">
                <SurfaceHeader
                    title="Custom attributes"
                    description="Workspace-defined fields on Contact, Company, and Deal. Add a date or list, group them, then edit or delete the definition."
                >
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        New attribute
                    </Button>
                </SurfaceHeader>

                {byEntity.length === 0 ? (
                    <HairlinePanel className="px-4 py-8">
                        <p className="aurora-text-body-sm text-mute">
                            No attributes yet. Start with Contact.
                        </p>
                    </HairlinePanel>
                ) : (
                    byEntity.map((entity) => (
                        <div key={entity.value} className="space-y-2">
                            <h2 className="aurora-text-eyebrow text-mute">
                                {entity.label}
                            </h2>
                            <HairlinePanel>
                                <HairlineTable minWidth="36rem">
                                    <thead>
                                        <tr className="border-b border-hairline">
                                            <HairlineTh>Label</HairlineTh>
                                            <HairlineTh>Key</HairlineTh>
                                            <HairlineTh>Group</HairlineTh>
                                            <HairlineTh>Type</HairlineTh>
                                            <HairlineTh>Fill</HairlineTh>
                                            <HairlineTh align="right">
                                                Actions
                                            </HairlineTh>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entity.items.map((definition) => (
                                            <HairlineRow key={definition.id}>
                                                <HairlineTd className="font-medium">
                                                    {definition.label}
                                                    {definition.required ? (
                                                        <Badge className="ml-2 border-transparent bg-brand/10 text-brand">
                                                            required
                                                        </Badge>
                                                    ) : null}
                                                </HairlineTd>
                                                <HairlineTd className="text-mute">
                                                    {definition.key}
                                                </HairlineTd>
                                                <HairlineTd className="text-mute">
                                                    {definition.group || 'General'}
                                                </HairlineTd>
                                                <HairlineTd>
                                                    <Badge variant="outline">
                                                        {definition.type}
                                                    </Badge>
                                                </HairlineTd>
                                                <HairlineTd className="text-mute">
                                                    {definition.fill_rate ? (
                                                        <span className="money tabular-nums">
                                                            {definition.fill_rate.filled}
                                                            /
                                                            {definition.fill_rate.total}
                                                            {' · '}
                                                            {definition.fill_rate.percent}%
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </HairlineTd>
                                                <HairlineTd>
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-brand"
                                                            onClick={() =>
                                                                setEditing(definition)
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </HairlineTd>
                                            </HairlineRow>
                                        ))}
                                    </tbody>
                                </HairlineTable>
                            </HairlinePanel>
                        </div>
                    ))
                )}
            </div>

            <CreateDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
                title="New attribute"
                description="Values are stored per record and shown on the contact or deal hub."
                showFormLink={false}
            >
                <DefinitionForm onDone={() => setCreateOpen(false)} />
            </CreateDrawer>

            <CreateDrawer
                open={Boolean(editing)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditing(null);
                    }
                }}
                title={editing ? `Edit ${editing.label}` : 'Edit attribute'}
                description={
                    editing
                        ? `${editing.entity} · ${editing.key}`
                        : undefined
                }
                showFormLink={false}
            >
                {editing ? (
                    <div className="space-y-4">
                        {editing.fill_rate ? (
                            <div className="space-y-1 rounded-lg border border-hairline bg-canvas-soft p-3">
                                <div className="flex items-center justify-between aurora-text-caption text-mute">
                                    <span>Fill rate</span>
                                    <span className="money tabular-nums">
                                        {editing.fill_rate.filled} / {editing.fill_rate.total} · {editing.fill_rate.percent}%
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                                    <div
                                        className="h-full bg-brand"
                                        style={{
                                            width: `${editing.fill_rate.percent}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <DefinitionForm
                            key={editing.id}
                            definition={editing}
                            onDone={() => setEditing(null)}
                        />

                        <Form
                            action={`/settings/attributes/${editing.id}`}
                            method="delete"
                        >
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    disabled={processing}
                                >
                                    Delete
                                </Button>
                            )}
                        </Form>
                    </div>
                ) : null}
            </CreateDrawer>
        </>
    );
}

AttributeSettings.layout = {
    breadcrumbs: [{ title: 'Custom attributes', href: '/settings/attributes' }],
};
