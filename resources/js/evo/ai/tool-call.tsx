/**
 * Evo Design System — ToolCall
 * Registry: PastaUI — tool-timeline
 * Source: https://github.com/syeddhasnainn/pastaui
 * Upstream: https://github.com/syeddhasnainn/pastaui @ d6a8b1b8eeed2f25acac8eb24abcc35651374705
 * License: MIT (LICENSE, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Solar → Phosphor; --evo-* tokens; French status labels.
 */

import type { AgentToolCall } from '@/evo/ai/types';
import { CheckCircle, CircleNotch, WarningCircle, Wrench } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

const STATUS_LABEL: Record<AgentToolCall['status'], string> = {
    running: 'En cours',
    done: 'Terminé',
    error: 'Erreur',
};

export function ToolCall({
    call,
    className,
}: {
    call: AgentToolCall;
    className?: string;
}) {
    return (
        <article
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface px-3 py-2.5',
                className,
            )}
            data-tool-call={call.status}
        >
            <div className="flex items-center gap-2">
                <StatusIcon status={call.status} />
                <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-evo-ink">
                    {call.name}
                </p>
                <span className="text-[11px] text-evo-ink-muted">{STATUS_LABEL[call.status]}</span>
            </div>
            {call.input ? (
                <p className="mt-1.5 font-evo-mono text-[11px] text-evo-ink-muted">{call.input}</p>
            ) : null}
            {call.error ? (
                <p className="mt-1.5 text-[12px] text-evo-danger">{call.error}</p>
            ) : null}
        </article>
    );
}

function StatusIcon({ status }: { status: AgentToolCall['status'] }) {
    if (status === 'running') {
        return (
            <CircleNotch
                className="size-3.5 animate-spin text-evo-teal motion-reduce:animate-none"
                weight="bold"
                aria-hidden
            />
        );
    }

    if (status === 'error') {
        return <WarningCircle className="size-3.5 text-evo-danger" weight="fill" aria-hidden />;
    }

    if (status === 'done') {
        return <CheckCircle className="size-3.5 text-evo-success" weight="fill" aria-hidden />;
    }

    return <Wrench className="size-3.5 text-evo-ink-muted" weight="regular" aria-hidden />;
}
