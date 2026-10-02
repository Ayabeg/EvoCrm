/**
 * Evo Design System — ApprovalCard
 * Registry: Tool UI (assistant-ui) — approval-card
 * Source: https://github.com/assistant-ui/tool-ui
 * Upstream: https://github.com/assistant-ui/tool-ui @ 49a870286facdbf28160cd647f0d337ebdc9b275
 * License: MIT (LICENSE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: lucide → Phosphor; --evo-* tokens; French; **never auto-executes**.
 */

import { z } from 'zod';
import type { AgentApproval, AgentApprovalStatus } from '@/evo/ai/types';
import { Warning } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';

export const approvalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    action: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
    status: z.enum(['pending', 'approved', 'denied']).default('pending'),
});

export type ApprovalCardProps = {
    approval: AgentApproval;
    onApprove?: (approval: AgentApproval) => void;
    onDeny?: (approval: AgentApproval) => void;
    className?: string;
};

const STATUS_LABEL: Record<AgentApprovalStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    denied: 'Refusé',
};

export function ApprovalCard({
    approval,
    onApprove,
    onDeny,
    className,
}: ApprovalCardProps) {
    const parsed = approvalSchema.safeParse(approval);
    const value = parsed.success ? parsed.data : approval;
    const pending = value.status === 'pending';

    return (
        <section
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface p-3',
                className,
            )}
            data-approval-status={value.status}
            aria-label={value.title}
        >
            <div className="flex items-start gap-2">
                <Warning className="mt-0.5 size-4 shrink-0 text-evo-warning" weight="fill" aria-hidden />
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-evo-ink">{value.title}</p>
                    {value.description ? (
                        <p className="mt-1 text-[12px] leading-5 text-evo-ink-secondary">
                            {value.description}
                        </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-evo-ink-muted">
                        {STATUS_LABEL[value.status]}
                    </p>
                </div>
            </div>
            {pending ? (
                <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDeny?.(approval)}
                    >
                        Refuser
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => onApprove?.(approval)}
                    >
                        Approuver
                    </Button>
                </div>
            ) : null}
        </section>
    );
}
