/**
 * Evo Design System — ReasoningDisclosure
 * Registry: PastaUI — reasoning-text
 * Source: https://github.com/syeddhasnainn/pastaui
 * Upstream: https://github.com/syeddhasnainn/pastaui @ d6a8b1b8eeed2f25acac8eb24abcc35651374705
 * License: MIT (LICENSE, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Solar → Phosphor; CSS module → Tailwind tokens; reduced-motion; aria-live.
 */

import * as Collapsible from '@radix-ui/react-collapsible';
import { useState } from 'react';
import { evoFocus } from '@/evo/ai/types';
import { CaretDown } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';

export function ReasoningDisclosure({
    title = 'Raisonnement',
    children,
    defaultOpen = false,
    className,
}: {
    title?: string;
    children: string;
    defaultOpen?: boolean;
    className?: string;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible.Root
            open={open}
            onOpenChange={setOpen}
            className={cn(
                'rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface-subtle',
                className,
            )}
        >
            <Collapsible.Trigger
                className={cn(
                    'flex min-h-8 w-full items-center justify-between gap-2 px-3 text-left text-[12px] font-medium text-evo-ink-secondary',
                    evoFocus,
                )}
            >
                <span>{title}</span>
                <CaretDown
                    className={cn(
                        'size-3.5 transition-transform duration-[var(--evo-duration-micro)] ease-evo motion-reduce:transition-none',
                        open && 'rotate-180',
                    )}
                    weight="bold"
                    aria-hidden
                />
            </Collapsible.Trigger>
            <Collapsible.Content>
                <p
                    className="border-t border-evo-hairline px-3 py-2 text-[12px] leading-5 whitespace-pre-wrap text-evo-ink-muted"
                    aria-live="polite"
                >
                    {children}
                </p>
            </Collapsible.Content>
        </Collapsible.Root>
    );
}
