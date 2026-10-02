/**
 * Evo Design System — TicketCard
 * Registry: custom Evo
 * License: MIT (original)
 */

import { PipelineCard } from '@/evo/crm/pipeline/PipelineCard';
import type { PipelineTicketCard } from '@/evo/crm/pipeline/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';

export function TicketCard({
    ticket,
    onOpen,
}: {
    ticket: PipelineTicketCard;
    onOpen?: (opener?: HTMLElement) => void;
}) {
    return (
        <PipelineCard
            id={`ticket:${ticket.id}`}
            href={ticket.href}
            label={ticket.subject}
            testId={`ticket-card-${ticket.id}`}
            onOpen={onOpen}
        >
            <div className="flex items-start justify-between gap-2">
                <a
                    href={ticket.href}
                    className="block min-w-0 truncate font-medium text-[var(--evo-ink)] hover:underline"
                >
                    {ticket.subject}
                </a>
                {ticket.priority && ticket.priority !== 'medium' ? (
                    <span
                        className={
                            ticket.priority === 'high'
                                ? 'shrink-0 text-[10px] font-medium text-[var(--evo-ink)]'
                                : 'shrink-0 text-[10px] font-medium text-[var(--evo-ink-muted)]'
                        }
                    >
                        {ticket.priority === 'high' ? t('High') : t('Low')}
                    </span>
                ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)] tabular-nums">
                {ticket.number}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                {ticket.association ?? t('No company')}
            </p>
            {ticket.inactive ? (
                <p className="mt-1 text-[11px] text-[var(--evo-ink-muted)]">
                    {ticket.inactive}
                </p>
            ) : null}
            {ticket.sla_label ? (
                <p
                    className={cn(
                        'mt-0.5 text-[11px]',
                        ticket.slaBreached
                            ? 'font-medium text-[var(--evo-ink)]'
                            : 'text-[var(--evo-ink-muted)]',
                    )}
                >
                    SLA {ticket.sla_label}
                </p>
            ) : null}
            <p className="mt-0.5 truncate text-[11px] text-[var(--evo-ink-muted)]">
                {ticket.owner ?? t('Unassigned')}
            </p>
        </PipelineCard>
    );
}
