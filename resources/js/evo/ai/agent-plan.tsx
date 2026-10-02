/**
 * Evo Design System — AgentPlan
 * Registry: Tool UI (assistant-ui) — plan
 * Source: https://github.com/assistant-ui/tool-ui
 * Upstream: https://github.com/assistant-ui/tool-ui @ 49a870286facdbf28160cd647f0d337ebdc9b275
 * License: MIT (LICENSE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: lucide → Phosphor; --evo-* tokens; French; no auto-run.
 */

import { z } from 'zod';
import type { AgentPlan } from '@/evo/ai/types';
import { CheckCircle, Circle, CircleNotch, WarningCircle } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export const planSchema = z.object({
    title: z.string(),
    steps: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            status: z.enum(['pending', 'running', 'done', 'error']),
        }),
    ),
});

export function AgentPlan({
    plan,
    className,
}: {
    plan: AgentPlan;
    className?: string;
}) {
    const parsed = planSchema.safeParse(plan);
    const value = parsed.success ? parsed.data : plan;

    return (
        <section
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface p-3',
                className,
            )}
            aria-label={value.title}
        >
            <p className="text-[12px] font-semibold text-evo-ink">{value.title}</p>
            <ol className="mt-2 space-y-1.5">
                {value.steps.map((step) => (
                    <li key={step.id} className="flex items-center gap-2 text-[12px] text-evo-ink">
                        <StepIcon status={step.status} />
                        <span>{step.label}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function StepIcon({ status }: { status: AgentPlan['steps'][number]['status'] }) {
    if (status === 'running') {
        return (
            <CircleNotch
                className="size-3.5 animate-spin text-evo-teal motion-reduce:animate-none"
                weight="bold"
                aria-hidden
            />
        );
    }

    if (status === 'done') {
        return <CheckCircle className="size-3.5 text-evo-success" weight="fill" aria-hidden />;
    }

    if (status === 'error') {
        return <WarningCircle className="size-3.5 text-evo-danger" weight="fill" aria-hidden />;
    }

    return <Circle className="size-3.5 text-evo-ink-faint" weight="regular" aria-hidden />;
}
