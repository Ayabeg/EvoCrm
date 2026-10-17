import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Card } from '@/evo/ui/card';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { SettingsForm, SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type StageRow = {
    id: number;
    name: string;
    slug: string;
    position: number;
    probability: number | null;
    is_won: boolean;
    is_lost: boolean;
    deals_count: number;
    required_properties?: string[];
    requires_approval?: boolean;
};

type DealProperty = {
    key: string;
    label: string;
    group: string;
};

type PipelineRow = {
    id: number;
    name: string;
    is_default: boolean;
    stages_count: number;
    deals_count: number;
    stages?: StageRow[];
};

function PipelineStages({
    pipeline,
    canManage,
    dealProperties,
}: {
    pipeline: PipelineRow;
    canManage: boolean;
    dealProperties: DealProperty[];
}) {
    const [open, setOpen] = useState(false);
    const stages = pipeline.stages ?? [];

    return (
        <div className="border-t px-4 py-2">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="text-xs font-medium text-brand hover:underline"
            >
                {open ? 'Hide stages' : `Manage ${stages.length} stages`}
            </button>
            {open ? (
                <div className="mt-3 space-y-3">
                    {stages.map((stage) => (
                        <div
                            key={stage.id}
                            className="flex flex-wrap items-end gap-2 rounded border border-hairline p-2"
                        >
                            {canManage ? (
                                <SettingsForm
                                    action={`/settings/pipelines/${pipeline.id}/stages/${stage.id}`}
                                    method="post"
                                    className="flex flex-wrap items-end gap-2"
                                >
                                    <input
                                        type="hidden"
                                        name="_method"
                                        value="patch"
                                    />
                                    <div>
                                        <Label className="text-[10px]">
                                            Name
                                        </Label>
                                        <Input
                                            name="name"
                                            defaultValue={stage.name}
                                            className="mt-0.5 h-8 w-36 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px]">
                                            Win %
                                        </Label>
                                        <Input
                                            name="probability"
                                            type="number"
                                            min={0}
                                            max={100}
                                            defaultValue={
                                                stage.probability ?? ''
                                            }
                                            className="mt-0.5 h-8 w-20 text-xs"
                                        />
                                    </div>
                                    <input
                                        type="hidden"
                                        name="required_properties_present"
                                        value="1"
                                    />
                                    <input
                                        type="hidden"
                                        name="requires_approval_present"
                                        value="1"
                                    />
                                    <label className="flex items-center gap-1 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            name="requires_approval"
                                            value="1"
                                            defaultChecked={
                                                stage.requires_approval
                                            }
                                        />
                                        {t('Approval required')}
                                    </label>
                                    <fieldset className="w-full">
                                        <legend className="text-[10px] text-mute">
                                            Required to enter
                                        </legend>
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                            {dealProperties.map((property) => (
                                                <label
                                                    key={property.key}
                                                    className="flex items-center gap-1 text-[11px] text-ink"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="required_properties[]"
                                                        value={property.key}
                                                        defaultChecked={(
                                                            stage.required_properties ??
                                                            []
                                                        ).includes(
                                                            property.key,
                                                        )}
                                                    />
                                                    {property.label}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Save
                                    </Button>
                                </SettingsForm>
                            ) : (
                                <span className="text-sm">
                                    {stage.name} ({stage.probability ?? '—'}%)
                                </span>
                            )}
                            <span className="text-[11px] text-mute">
                                {stage.deals_count} deals
                            </span>
                            {canManage && stage.deals_count === 0 ? (
                                <SettingsForm
                                    action={`/settings/pipelines/${pipeline.id}/stages/${stage.id}`}
                                    method="post"
                                    className="inline"
                                >
                                    <input
                                        type="hidden"
                                        name="_method"
                                        value="delete"
                                    />
                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Delete
                                    </Button>
                                </SettingsForm>
                            ) : null}
                        </div>
                    ))}
                    {canManage ? (
                        <SettingsForm
                            action={`/settings/pipelines/${pipeline.id}/stages`}
                            method="post"
                            className="flex flex-wrap items-end gap-2"
                        >
                            <div>
                                <Label className="text-[10px]">
                                    {t('New stage')}
                                </Label>
                                <Input
                                    name="name"
                                    required
                                    placeholder="Negotiation"
                                    className="mt-0.5 h-8 w-40 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px]">
                                    {t('Win %')}
                                </Label>
                                <Input
                                    name="probability"
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="mt-0.5 h-8 w-20 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm">
                                {t('Add stage')}
                            </Button>
                        </SettingsForm>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

export default function PipelineSettings({
    pipelines,
    canManage,
    dealProperties = [],
}: {
    pipelines: PipelineRow[];
    canManage: boolean;
    dealProperties?: DealProperty[];
}) {
    return (
        <>
            <Head title={t('Pipelines')} />
            <div className="space-y-6">
                <SettingsPageHeader
                    title="Deal pipelines"
                    description="Create pipelines, edit stage names and win probabilities, and require deal fields before a card can enter a stage."
                />

                {canManage ? (
                    <Card className="space-y-3 p-4">
                        <h2 className="text-sm font-semibold">
                            {t('Add pipeline')}
                        </h2>
                        <SettingsForm
                            action="/settings/pipelines"
                            method="post"
                            className="grid gap-3 md:grid-cols-3"
                        >
                            <div>
                                <Label htmlFor="pipeline-name">
                                    {t('Name')}
                                </Label>
                                <Input
                                    id="pipeline-name"
                                    name="name"
                                    required
                                    placeholder="Enterprise"
                                    className="mt-1"
                                />
                            </div>
                            <label className="flex items-end gap-2 pb-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="is_default"
                                    value="1"
                                />
                                {t('Set as default')}
                            </label>
                            <div className="flex items-end">
                                <Button type="submit">
                                    {t('Create pipeline')}
                                </Button>
                            </div>
                        </SettingsForm>
                    </Card>
                ) : null}

                <div className="space-y-3">
                    {pipelines.map((pipeline) => (
                        <Card key={pipeline.id} className="overflow-hidden">
                            <div className="grid grid-cols-4 gap-2 px-4 py-3 text-sm">
                                <div className="col-span-2 flex items-center gap-2">
                                    <span className="font-medium">
                                        {pipeline.name}
                                    </span>
                                    {pipeline.is_default ? (
                                        <Badge variant="secondary">
                                            {t('Default')}
                                        </Badge>
                                    ) : null}
                                </div>
                                <div>
                                    {t(':count stages', {
                                        count: pipeline.stages_count,
                                    })}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span>
                                        {t(':count deals', {
                                            count: pipeline.deals_count,
                                        })}
                                    </span>
                                    {canManage &&
                                    !pipeline.is_default &&
                                    pipeline.deals_count === 0 ? (
                                        <SettingsForm
                                            action={`/settings/pipelines/${pipeline.id}`}
                                            method="post"
                                            className="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="_method"
                                                value="delete"
                                            />
                                            <Button
                                                type="submit"
                                                variant="secondary"
                                                size="sm"
                                            >
                                                {t('Delete')}
                                            </Button>
                                        </SettingsForm>
                                    ) : null}
                                    {canManage && !pipeline.is_default ? (
                                        <SettingsForm
                                            action={`/settings/pipelines/${pipeline.id}`}
                                            method="post"
                                            className="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="_method"
                                                value="patch"
                                            />
                                            <input
                                                type="hidden"
                                                name="is_default"
                                                value="1"
                                            />
                                            <Button
                                                type="submit"
                                                variant="secondary"
                                                size="sm"
                                            >
                                                {t('Make default')}
                                            </Button>
                                        </SettingsForm>
                                    ) : null}
                                </div>
                            </div>
                            <PipelineStages
                                pipeline={pipeline}
                                canManage={canManage}
                                dealProperties={dealProperties}
                            />
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

PipelineSettings.layout = {
    breadcrumbs: [{ title: 'Pipelines', href: '/settings/pipelines' }],
};
