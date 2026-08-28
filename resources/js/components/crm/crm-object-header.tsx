import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CrmObjectHeader({
    title,
    description,
    primaryLabel,
    onPrimary,
    secondary,
}: {
    title: string;
    description?: string;
    primaryLabel: string;
    onPrimary: () => void;
    secondary?: ReactNode;
}) {
    return (
        <header
            className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-3 sm:px-6"
            data-crm="object-header"
        >
            <div className="min-w-0">
                <h1 className="text-page-title font-semibold tracking-tight text-ink">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-0.5 truncate text-[11px] leading-4 text-mute">
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {secondary}
                <Button
                    type="button"
                    size="sm"
                    onClick={onPrimary}
                    className={cn('h-8 shrink-0')}
                >
                    {primaryLabel}
                </Button>
            </div>
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
