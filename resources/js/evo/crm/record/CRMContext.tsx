/**
 * Evo Design System — CRMContext
 * Shared context pane for Inbox (PR6) and Agents. Import from @/evo/crm/record.
 * Registry: custom Evo
 * License: MIT (original)
 */

import { Associations } from '@/evo/crm/record/Associations';
import { NextAction } from '@/evo/crm/record/NextAction';
import { RecordIdentity } from '@/evo/crm/record/RecordIdentity';
import { RecordProperties } from '@/evo/crm/record/RecordProperties';
import type { CRMContextRecord } from '@/evo/crm/record/types';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export function CRMContext({
    record,
    empty = 'No CRM context',
    onOpen,
}: {
    record?: CRMContextRecord | null;
    empty?: string;
    onOpen?: () => void;
}) {
    if (!record) {
        return (
            <aside
                className="border-l border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-4"
                data-evo="crm-context"
                aria-label={t('CRM context')}
            >
                <p className="text-[13px] text-[var(--evo-ink-muted)]">
                    {t(empty)}
                </p>
            </aside>
        );
    }

    return (
        <aside
            className="space-y-4 border-l border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-4"
            data-evo="crm-context"
            aria-label={t('CRM context')}
        >
            <RecordIdentity
                title={record.title}
                kind={record.ref.type}
                subtitle={record.subtitle}
                statusLabel={record.status?.label}
            />
            <RecordProperties
                properties={record.keyProperties.map((property) => ({
                    id: property.id,
                    label: property.label,
                    value: property.value,
                    href: property.href,
                }))}
            />
            <Associations items={record.associations} />
            <NextAction action={record.nextAction} />
            <Button asChild variant="outline" size="sm">
                <a href={record.fullRecordHref} onClick={onOpen}>
                    {t('Open full record')}
                </a>
            </Button>
        </aside>
    );
}
