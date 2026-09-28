import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import type { AgentsViewMode } from '@/lib/desk/agents-view-mode';

const CROSSFADE = {
    duration: 0.15,
    ease: [0.2, 0.8, 0.2, 1] as const,
};

export function AgentsViewModePanel({
    children,
    className,
    mode,
}: {
    children: ReactNode;
    className?: string;
    mode: AgentsViewMode;
}) {
    const reduce = useReducedMotion() === true;

    return (
        <AnimatePresence initial={false} mode="wait">
            <motion.div
                key={mode}
                animate={{ opacity: 1 }}
                className={className}
                data-agents-view-mode={mode}
                exit={reduce ? undefined : { opacity: 0 }}
                initial={reduce ? false : { opacity: 0 }}
                transition={reduce ? { duration: 0 } : CROSSFADE}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
