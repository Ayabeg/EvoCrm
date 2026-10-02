import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    RecordLayoutProvider,
    useRecordLayoutContext,
} from '@/components/crm/record-layout-context';
import {
    RecordLayoutCustomizeButton,
    RecordLayoutEditor,
} from '@/components/crm/record-layout-editor';
import { Button } from '@/evo/ui/button';
import { SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
import type { RecordLayoutState, RecordObjectType } from '@/lib/record-layout';
import { cn } from '@/lib/utils';

const ENTITIES: { value: RecordObjectType; label: string }[] = [
    { value: 'contact', label: 'Contacts' },
    { value: 'company', label: 'Companies' },
    { value: 'deal', label: 'Deals' },
];

function SaveWorkspaceDefaultButton() {
    const { saveWorkspaceDefault, savingDefault } = useRecordLayoutContext();

    return (
        <Button
            type="button"
            onClick={() => void saveWorkspaceDefault()}
            disabled={savingDefault}
        >
            {savingDefault ? 'Saving…' : 'Save as workspace default'}
        </Button>
    );
}

function EntityLayoutEditor({
    entity,
    seedLayout,
}: {
    entity: RecordObjectType;
    seedLayout: RecordLayoutState | null;
}) {
    return (
        <RecordLayoutProvider
            objectType={entity}
            mode="workspace"
            seedLayout={seedLayout}
        >
            <div className="flex flex-wrap items-center gap-2">
                <RecordLayoutCustomizeButton />
                <SaveWorkspaceDefaultButton />
            </div>
            <RecordLayoutEditor />
            <p className="text-[12px] text-muted-foreground">
                Workspace defaults apply to all members who have not saved a
                personal layout for this record type.
            </p>
        </RecordLayoutProvider>
    );
}

export default function RecordLayoutsSettings({
    layouts,
}: {
    layouts: Record<RecordObjectType, RecordLayoutState | null>;
}) {
    const [entity, setEntity] = useState<RecordObjectType>('contact');

    return (
        <>
            <Head title={t('Record layouts')} />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="Record layouts"
                    description="Set the default card order and visibility for contact, company, and deal records across your workspace."
                />
                <nav className="flex gap-2">
                    {ENTITIES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setEntity(item.value)}
                            className={cn(
                                'rounded-md border px-3 py-1.5 text-sm',
                                entity === item.value
                                    ? 'border-brand bg-canvas-soft font-medium text-ink'
                                    : 'border-hairline text-muted-foreground hover:text-ink',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <EntityLayoutEditor
                    key={entity}
                    entity={entity}
                    seedLayout={layouts[entity] ?? null}
                />
            </div>
        </>
    );
}

RecordLayoutsSettings.layout = {
    breadcrumbs: [
        { title: 'Record layouts', href: '/settings/record-layouts' },
    ],
};
