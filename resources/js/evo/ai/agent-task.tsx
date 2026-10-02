/**
 * Evo Design System — AgentTask
 * Registry: PastaUI — todo-list
 * Source: https://github.com/syeddhasnainn/pastaui
 * Upstream: https://github.com/syeddhasnainn/pastaui @ d6a8b1b8eeed2f25acac8eb24abcc35651374705
 * License: MIT (LICENSE, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Solar → Phosphor; --evo-* tokens; reduced-motion.
 */

import type { AgentTaskItem } from '@/evo/ai/types';
import { CheckSquare, Square } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export function AgentTask({
    title = 'Tâches',
    items,
    className,
}: {
    title?: string;
    items: AgentTaskItem[];
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface p-3',
                className,
            )}
            aria-label={title}
        >
            <p className="text-[12px] font-semibold text-evo-ink">{title}</p>
            <ul className="mt-2 space-y-1.5">
                {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-[12px] text-evo-ink">
                        {item.done ? (
                            <CheckSquare className="size-3.5 text-evo-success" weight="fill" aria-hidden />
                        ) : (
                            <Square className="size-3.5 text-evo-ink-faint" weight="regular" aria-hidden />
                        )}
                        <span className={item.done ? 'text-evo-ink-muted line-through' : undefined}>
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
