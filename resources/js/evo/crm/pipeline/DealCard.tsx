/**
 * Evo Design System — DealCard
 * Registry: custom Evo
 * License: MIT (original)
 */

import type { ReactNode } from 'react';
import { PipelineCard } from '@/evo/crm/pipeline/PipelineCard';
import type { PipelineDealCard } from '@/evo/crm/pipeline/types';
import { t } from '@/lib/i18n';

export function DealCard({
    deal,
    menu,
    onOpen,
}: {
    deal: PipelineDealCard;
    menu?: ReactNode;
    onOpen?: (opener?: HTMLElement) => void;
}) {
    return (
        <PipelineCard
            id={`deal:${deal.id}`}
            href={deal.href}
            label={t('Inspect :title', { title: deal.title })}
            testId={`deal-card-${deal.id}`}
            onOpen={onOpen}
            className={deal.compact ? 'px-2 py-1.5' : undefined}
            dataAttention={deal.attentionType ?? ''}
            dataAttentionSeverity={deal.attentionSeverity ?? undefined}
        >
            <div
                data-attention={deal.attentionType ?? ''}
                data-attention-severity={deal.attentionSeverity ?? undefined}
            >
                <div className="flex items-start justify-between gap-2">
                    <a
                        href={deal.href}
                        className="block min-w-0 truncate font-medium text-[var(--evo-ink)] hover:underline"
                    >
                        {deal.title}
                    </a>
                    {menu}
                </div>
                {deal.association ? (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.association}
                    </p>
                ) : null}
                <p className="mt-1 text-[13px] font-semibold break-words text-[var(--evo-ink)] tabular-nums">
                    {deal.amount}
                </p>
                {deal.compact ? null : deal.owner ? (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.owner}
                    </p>
                ) : (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                        {t('Unassigned')}
                    </p>
                )}
                {deal.attention ? (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink)]">
                        {deal.attention}
                    </p>
                ) : null}
                {deal.nextActivity ? (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.nextActivity}
                    </p>
                ) : null}
                {deal.quotes ? (
                    <p className="mt-0.5 text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.quotes}
                    </p>
                ) : null}
                {deal.inactive ? (
                    <p className="mt-1 text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.inactive}
                    </p>
                ) : null}
                {deal.closeDate ? (
                    <p className="mt-0.5 text-[11px] text-[var(--evo-ink-muted)]">
                        {deal.closeDate}
                    </p>
                ) : null}
                {deal.priority ? (
                    <p
                        className={
                            deal.priority === 'high'
                                ? 'mt-0.5 text-[10px] font-medium text-[var(--evo-ink)]'
                                : 'mt-0.5 text-[10px] font-medium text-[var(--evo-ink-muted)]'
                        }
                    >
                        {deal.priority === 'high' ? t('High') : t('Low')}
                    </p>
                ) : null}
            </div>
        </PipelineCard>
    );
}
