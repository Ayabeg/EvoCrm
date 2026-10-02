/**
 * Evo Design System — QuoteWorkspace
 * Registry: custom Evo
 * License: MIT (original)
 */

import { useState } from 'react';
import { LineItems } from '@/evo/crm/quote/LineItems';
import { PDFPreview } from '@/evo/crm/quote/PDFPreview';
import { QuoteLifecycle } from '@/evo/crm/quote/QuoteLifecycle';
import { Totals } from '@/evo/crm/quote/Totals';
import type { QuoteLine, QuoteWorkspaceRecord } from '@/evo/crm/quote/types';
import { RecordIdentity } from '@/evo/crm/record/RecordIdentity';
import { RecordPageFrame } from '@/evo/crm/record/RecordWorkspace';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export function QuoteWorkspace({
    quote,
    onItemsChange,
}: {
    quote: QuoteWorkspaceRecord;
    onItemsChange?: (items: QuoteLine[]) => void;
}) {
    const [items, setItems] = useState(quote.items);
    const editable = Boolean(onItemsChange) && !quote.immutable;

    return (
        <RecordPageFrame
            testId="quote-workspace"
            header={
                <div
                    className="flex flex-wrap items-start justify-between gap-3"
                    data-crm="quotes-record"
                >
                    <RecordIdentity
                        title={quote.title}
                        kind="Quote"
                        subtitle={[
                            quote.contactName ?? t('No contact'),
                            quote.companyName,
                            quote.ownerName,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                        statusLabel={quote.statusLabel}
                    />
                    {quote.previewHref ? (
                        <PDFPreview href={quote.previewHref} />
                    ) : null}
                </div>
            }
        >
            <QuoteLifecycle
                status={quote.status}
                revoked={quote.status === 'revoked'}
            />
            <div className="grid min-h-0 flex-1 gap-px overflow-hidden bg-[var(--evo-hairline)] lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section
                    className="min-h-0 overflow-y-auto bg-[var(--evo-surface)] px-5 py-5"
                    data-quote="document"
                >
                    <p className="text-[11px] font-semibold tracking-wide text-[var(--evo-ink-muted)] uppercase">
                        {t('Quote')}
                    </p>
                    {quote.number ? (
                        <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                            {t('Quote #:id', { id: quote.number })}
                        </p>
                    ) : null}
                    <h2 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight">
                        {quote.title}
                    </h2>
                    {quote.immutable ? (
                        <p className="mt-3 text-[12px] text-[var(--evo-ink-muted)]">
                            {t('Sent quotes cannot be edited.')}
                        </p>
                    ) : null}
                    <div className="mt-6">
                        <LineItems
                            items={items}
                            editable={editable}
                            onChange={
                                editable
                                    ? (next) => {
                                          setItems(next);
                                          onItemsChange?.(next);
                                      }
                                    : undefined
                            }
                        />
                    </div>
                    {quote.notes ? (
                        <p className="mt-6 text-[13px]">{quote.notes}</p>
                    ) : (
                        <p className="mt-6 text-[12px] text-[var(--evo-ink-muted)]">
                            {t('No notes.')}
                        </p>
                    )}
                    <div className="mt-6">
                        <Totals totals={quote.totals} />
                    </div>
                </section>
                <aside
                    className="min-h-0 overflow-y-auto bg-[var(--evo-surface)] px-4 py-4"
                    data-quote="properties"
                >
                    <Status tone="neutral" label={quote.statusLabel} />
                    {quote.expiresAt ? (
                        <p className="mt-3 text-[13px] text-[var(--evo-ink-secondary)]">
                            {t('Expires')} · {quote.expiresAt}
                        </p>
                    ) : (
                        <p className="mt-3 text-[13px] text-[var(--evo-ink-muted)]">
                            {t('No expiration')}
                        </p>
                    )}
                </aside>
            </div>
        </RecordPageFrame>
    );
}
