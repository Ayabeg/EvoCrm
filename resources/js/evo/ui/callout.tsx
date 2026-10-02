/**
 * Evo Design System — Callout
 * Registry: ReUI — alert
 * Source: https://reui.io/components/alert
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: product CalloutVariant API kept; Evo tokens; Phosphor.
 */

import * as React from 'react';

import { CheckCircle, Info, Warning, WarningCircle } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export type CalloutVariant = 'info' | 'success' | 'warn' | 'error' | 'neutral' | 'rose';

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    variant?: CalloutVariant;
    title?: React.ReactNode;
    icon?: React.ReactNode;
}

const tone: Record<CalloutVariant, { box: string; Icon: typeof Info }> = {
    info: { box: 'border-[var(--evo-teal)] bg-[var(--evo-info-soft)]', Icon: Info },
    success: { box: 'border-[var(--evo-success)] bg-[var(--evo-success-soft)]', Icon: CheckCircle },
    warn: { box: 'border-[var(--evo-warning)] bg-[var(--evo-warning-soft)]', Icon: Warning },
    error: { box: 'border-[var(--evo-danger)] bg-[var(--evo-danger-soft)]', Icon: WarningCircle },
    neutral: { box: 'border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)]', Icon: Info },
    rose: { box: 'border-[var(--evo-danger)] bg-[var(--evo-danger-soft)]', Icon: WarningCircle },
};

function Callout({ className, variant = 'info', title, icon, children, ...props }: CalloutProps) {
    const { box, Icon } = tone[variant];

    return (
        <div
            role="note"
            data-slot="callout"
            className={cn('flex gap-2 rounded-[var(--evo-radius-standard)] border px-3 py-2.5 text-[13px]', box, className)}
            {...props}
        >
            {icon ?? <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />}
            <div className="min-w-0">
                {title ? <p className="font-medium">{title}</p> : null}
                {children ? <div className="text-[12px] text-[var(--evo-ink-secondary)]">{children}</div> : null}
            </div>
        </div>
    );
}

export { Callout };
export default Callout;
