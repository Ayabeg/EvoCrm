/**
 * Evo Design System — Pipeline DragOverlay
 * Registry: custom Evo on @dnd-kit/core DragOverlay
 * License: MIT (original)
 */

import { DragOverlay } from '@dnd-kit/core';
import type { ReactNode } from 'react';

export function PipelineDragOverlay({ children }: { children?: ReactNode }) {
    return (
        <DragOverlay dropAnimation={null}>
            {children ? (
                <div className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-2.5 py-2 text-[13px] shadow-[var(--evo-shadow-overlay)]">
                    {children}
                </div>
            ) : null}
        </DragOverlay>
    );
}
