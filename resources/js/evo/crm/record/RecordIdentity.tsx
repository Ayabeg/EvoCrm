/**
 * Evo Design System — RecordIdentity / RecordHeader
 * Registry: custom Evo
 * License: MIT (original)
 */

import type { ReactNode } from 'react';
import { ArrowLeft } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { Avatar } from '@/evo/ui/avatar';
import type { BadgeTone } from '@/evo/ui/badge';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

function initialsFrom(title: string): string {
    return title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function RecordBack({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]"
        >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t(label)}
        </a>
    );
}

export function RecordHeader({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn('flex flex-col gap-2', className)}
            data-evo="record-header"
        >
            {children}
        </div>
    );
}

export function RecordIdentity({
    title,
    initials,
    kind,
    subtitle,
    meta,
    badge,
    actions,
    actionsClassName,
    statusLabel,
    statusTone,
}: {
    title: string;
    initials?: string;
    kind?: string;
    subtitle?: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    actionsClassName?: string;
    statusLabel?: string;
    statusTone?: BadgeTone;
}) {
    return (
        <div
            className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            data-evo="record-identity"
        >
            <div className="flex min-w-0 items-start gap-3">
                <Avatar
                    size="md"
                    initials={initials || initialsFrom(title) || '?'}
                    alt={title}
                    className="shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h1 className="min-w-0 truncate text-[20px] leading-snug font-semibold tracking-tight text-[var(--evo-ink)]">
                            {title}
                        </h1>
                        {badge}
                        {statusLabel ? (
                            <Status
                                tone={statusTone ?? 'neutral'}
                                label={statusLabel}
                            />
                        ) : null}
                        {kind ? (
                            <span className="text-[11px] text-[var(--evo-ink-muted)]">
                                {t(kind)}
                            </span>
                        ) : null}
                    </div>
                    {subtitle ? (
                        <div className="text-[13px] leading-snug text-[var(--evo-ink-secondary)]">
                            {subtitle}
                        </div>
                    ) : null}
                    {meta}
                </div>
            </div>
            {actions ? (
                <div
                    className={cn(
                        'min-w-0 shrink-0 sm:max-w-[22rem] sm:pt-0.5',
                        actionsClassName,
                    )}
                >
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
