import type { ReactNode } from 'react';
import {
    MorphingPopover,
    MorphingPopoverContent,
    MorphingPopoverTrigger,
} from '@/components/ui/morphing-popover';
import { buttonVariants } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function MorphingForm({
    label,
    title,
    description,
    open,
    onOpenChange,
    triggerClassName,
    triggerTestId,
    plainTrigger = false,
    children,
}: {
    label: string;
    title: string;
    description?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    triggerClassName?: string;
    triggerTestId?: string;
    plainTrigger?: boolean;
    children: ReactNode;
}) {
    return (
        <MorphingPopover open={open} onOpenChange={onOpenChange}>
            <MorphingPopoverTrigger
                {...(triggerTestId ? { 'data-test': triggerTestId } : {})}
                className={cn(
                    plainTrigger
                        ? 'inline-flex items-center bg-transparent text-[12px] text-mute hover:text-ink'
                        : buttonVariants({ size: 'sm' }),
                    plainTrigger ? undefined : 'h-9 shrink-0',
                    triggerClassName,
                )}
            >
                {t(label)}
            </MorphingPopoverTrigger>
            <MorphingPopoverContent>
                <div className="border-b border-hairline px-4 py-3">
                    <h2 className="text-[15px] font-semibold tracking-tight text-ink">{t(title)}</h2>
                    {description ? (
                        <p className="mt-1 text-[12px] leading-4 text-mute">{t(description)}</p>
                    ) : null}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
            </MorphingPopoverContent>
        </MorphingPopover>
    );
}
