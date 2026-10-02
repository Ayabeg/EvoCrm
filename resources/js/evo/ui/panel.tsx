/**
 * Evo Design System — Panel
 * Registry: custom Evo (card raised)
 * License: MIT (original)
 * Copied: 2026-10-01
 */

import * as React from 'react';

import { cn } from '@/evo/lib/cn';
import { Card } from '@/evo/ui/card';

function Panel({ className, ...props }: React.ComponentProps<typeof Card>) {
    return (
        <Card
            data-slot="panel"
            className={cn('bg-[var(--evo-surface-raised)] shadow-[var(--evo-shadow-floating)]', className)}
            {...props}
        />
    );
}

export { Panel };
