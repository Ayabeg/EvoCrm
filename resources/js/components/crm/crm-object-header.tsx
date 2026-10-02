import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CrmObjectHeader({
    title,
    description,
    primaryLabel,
    onPrimary,
    primarySlot,
    primaryClassName,
    secondary,
}: {
    title: string;
    description?: string;
    primaryLabel?: string;
    onPrimary?: () => void;
    primarySlot?: ReactNode;
    primaryClassName?: string;
    secondary?: ReactNode;
}) {
    return (
        <header
            className="flex flex-col gap-2 border-b border-hairline bg-canvas px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6"
            data-crm="object-header"
        >
            <div className="min-w-0">
                <h1 className="text-page-title text-[15px] font-semibold tracking-tight text-ink">
                    {t(title)}
                </h1>
                {description ? (
                    <p className="mt-0.5 text-[12px] leading-4 text-mute">
                        {description}
                    </p>
                ) : null}
            </div>
            {secondary || primarySlot || (primaryLabel && onPrimary) ? (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {secondary}
                    {primarySlot}
                    {primaryLabel && onPrimary && !primarySlot ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onPrimary}
                            className={cn(
                                'h-8 shrink-0 bg-[var(--primary)] text-white hover:bg-[var(--evosales-ink-hover)]',
                                primaryClassName,
                            )}
                        >
                            {t(primaryLabel)}
                        </Button>
                    ) : null}
                </div>
            ) : null}
        </header>
    );
}

export function CrmObjectSecondaryLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-[12px] text-mute transition-colors hover:text-ink"
        >
            {children}
        </Link>
    );
}
