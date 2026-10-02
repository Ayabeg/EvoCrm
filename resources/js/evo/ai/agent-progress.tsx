/**
 * Evo Design System — AgentProgress
 * Registry: Tool UI (assistant-ui) — progress-tracker
 * Source: https://github.com/assistant-ui/tool-ui
 * Upstream: https://github.com/assistant-ui/tool-ui @ 49a870286facdbf28160cd647f0d337ebdc9b275
 * License: MIT (LICENSE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: lucide → Phosphor; --evo-* tokens; aria-live.
 */

import { z } from 'zod';
import type { AgentProgress as AgentProgressValue } from '@/evo/ai/types';
import { cn } from '@/evo/lib/cn';
import { Progress } from '@/evo/ui/progress';

export const progressSchema = z.object({
    label: z.string(),
    current: z.number(),
    total: z.number().positive(),
});

export function AgentProgress({
    progress,
    className,
}: {
    progress: AgentProgressValue;
    className?: string;
}) {
    const parsed = progressSchema.safeParse(progress);
    const value = parsed.success ? parsed.data : progress;
    const percent = Math.min(100, Math.round((value.current / Math.max(value.total, 1)) * 100));

    return (
        <div
            className={cn('space-y-1.5', className)}
            role="status"
            aria-live="polite"
            aria-label={`${value.label} ${value.current} sur ${value.total}`}
        >
            <div className="flex items-center justify-between text-[12px] text-evo-ink-secondary">
                <span>{value.label}</span>
                <span>
                    {value.current}/{value.total}
                </span>
            </div>
            <Progress value={percent} />
        </div>
    );
}
