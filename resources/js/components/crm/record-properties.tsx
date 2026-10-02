import { Form, Link } from '@inertiajs/react';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { t } from '@/lib/i18n';

export type AttributeDefinition = {
    id: number;
    entity: string;
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'list' | string;
    options?: string[] | null;
    group?: string | null;
    required?: boolean;
};

export type AttributeBag = {
    definitions?: AttributeDefinition[];
    values?: Record<string, string | null>;
};

function fieldType(type: string): string {
    if (type === 'number') {
        return 'number';
    }

    if (type === 'date') {
        return 'date';
    }

    return 'text';
}

function isSelect(type: string): boolean {
    return type === 'select' || type === 'list';
}

function AttributeField({
    definition,
    value,
}: {
    definition: AttributeDefinition;
    value: string;
}) {
    const name = `attributes[${definition.key}]`;
    const required = Boolean(definition.required);

    return (
        <div className="space-y-1">
            <Label className="text-[11px] text-mute">
                {definition.label}
                {required ? <span className="text-brand"> *</span> : null}
            </Label>
            {isSelect(definition.type) ? (
                <select
                    name={name}
                    defaultValue={value}
                    required={required}
                    className="h-8 w-full rounded border border-hairline bg-canvas px-2 text-sm text-ink"
                >
                    <option value="">{required ? t('Choose…') : '—'}</option>
                    {(definition.options ?? []).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <Input
                    name={name}
                    type={fieldType(definition.type)}
                    defaultValue={value}
                    required={required}
                    step={definition.type === 'number' ? 'any' : undefined}
                    className="h-8"
                />
            )}
        </div>
    );
}

export default function RecordProperties({
    action,
    attributes,
}: {
    action: string;
    attributes: AttributeBag;
}) {
    const definitions = attributes.definitions ?? [];
    const values = attributes.values ?? {};

    const groups = definitions.reduce<Record<string, AttributeDefinition[]>>((acc, definition) => {
        const name = definition.group?.trim() || t('General');
        acc[name] = acc[name] ?? [];
        acc[name].push(definition);

        return acc;
    }, {});

    if (definitions.length === 0) {
        return (
            <p className="text-[12px] text-mute">
                <Link
                    href="/settings/attributes"
                    className="font-medium text-ink hover:underline"
                >
                    {t('Manage attributes')}
                </Link>
            </p>
        );
    }

    return (
        <section className="text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-mute uppercase">{t('Attributes')}</h3>
                <Link href="/settings/attributes" className="text-[11px] text-ink hover:underline">
                    {t('Manage')}
                </Link>
            </div>
            <Form action={action} method="put" className="space-y-3">
                {({ processing }) => (
                    <>
                        {Object.entries(groups).map(([group, fields]) => (
                            <div key={group} className="space-y-2">
                                <p className="text-[11px] font-medium text-ink">{t(group)}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {fields.map((definition) => (
                                        <AttributeField
                                            key={definition.id}
                                            definition={definition}
                                            value={values[definition.key] ?? ''}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            className="h-8"
                            disabled={processing}
                        >
                            {t('Save attributes')}
                        </Button>
                    </>
                )}
            </Form>
        </section>
    );
}
