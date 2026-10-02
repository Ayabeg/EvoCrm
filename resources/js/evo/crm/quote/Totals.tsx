/**
 * Evo Design System — Quote Totals
 * Registry: custom Evo
 * License: MIT (original)
 */

import type { QuoteTotalsValue } from '@/evo/crm/quote/types';
import { formatMoney } from '@/evo/lib/format';
import { t } from '@/lib/i18n';

export function Totals({ totals }: { totals: QuoteTotalsValue }) {
    return (
        <dl
            className="ms-auto w-full max-w-xs space-y-1 text-[13px]"
            data-evo="quote-totals"
        >
            <div className="flex justify-between gap-4">
                <dt className="text-[var(--evo-ink-muted)]">{t('Subtotal')}</dt>
                <dd className="font-medium tabular-nums">
                    {formatMoney(totals.subtotalDzd)}
                </dd>
            </div>
            {totals.taxDzd != null ? (
                <div className="flex justify-between gap-4">
                    <dt className="text-[var(--evo-ink-muted)]">{t('Tax')}</dt>
                    <dd className="tabular-nums">
                        {formatMoney(totals.taxDzd)}
                    </dd>
                </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-[var(--evo-hairline)] pt-2 text-[16px] font-semibold">
                <dt>{t('Total')}</dt>
                <dd className="tabular-nums">{formatMoney(totals.totalDzd)}</dd>
            </div>
        </dl>
    );
}
