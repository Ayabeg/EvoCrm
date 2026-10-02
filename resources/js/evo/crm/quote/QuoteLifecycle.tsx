/**
 * Evo Design System — QuoteLifecycle
 * Registry: custom Evo on RecordPath
 * License: MIT (original)
 */

import type { QuoteLifecycleStatus } from '@/evo/crm/quote/types';
import { RecordPath } from '@/evo/crm/record/RecordPath';
import { t } from '@/lib/i18n';

const STEPS: { id: QuoteLifecycleStatus; label: string }[] = [
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'accepted', label: 'Accepted' },
];

export function QuoteLifecycle({
    status,
    revoked = false,
}: {
    status: QuoteLifecycleStatus;
    revoked?: boolean;
}) {
    const current = revoked || status === 'revoked' ? undefined : status;

    return (
        <RecordPath
            label={t('Quote lifecycle')}
            current={current}
            steps={STEPS.map((step) => ({
                ...step,
                label: t(step.label),
                disabled: true,
                complete:
                    STEPS.findIndex((row) => row.id === status) >
                    STEPS.findIndex((row) => row.id === step.id),
            }))}
        />
    );
}
