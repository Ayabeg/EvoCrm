import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ListView } from '@/components/crm/list-chrome';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Brand Book + Aurora surface radius for CRM record hubs. */
export const RECORD_HUB_RADIUS = 12;

const ALGIERS = 'Africa/Algiers';

export function recordInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function formatRecordWhen(iso?: string | null): string | null {
    if (!iso) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: ALGIERS,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

function isEmptyFact(value?: string | null): boolean {
    return value == null || value === '' || value === '—';
}

export function RecordHubHeader({
    title,
    views = [],
    activeView = '',
    primaryLabel,
    onPrimary,
    headerActions,
}: {
    title: string;
    views?: ListView[];
    activeView?: string;
    primaryLabel: string;
    onPrimary: () => void;
    headerActions?: ReactNode;
}) {
    return (
        <header className="border-b border-hairline bg-canvas px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-page-title font-semibold tracking-tight text-ink">
                    {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    {headerActions}
                    <Button onClick={onPrimary} size="sm">
                        {primaryLabel}
                    </Button>
                </div>
            </div>
            {views.length > 0 ? (
                <nav
                    className="mt-3 flex items-end gap-1 overflow-x-auto border-b border-hairline"
                    aria-label="Layouts"
                >
                    {views.map((view) => {
                        const active = activeView === view.key;

                        return (
                            <Link
                                key={view.key}
                                href={view.href}
                                className={cn(
                                    'relative shrink-0 px-3 py-[9px] text-[13px] font-medium transition-colors',
                                    active
                                        ? 'text-ink after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-brand'
                                        : 'text-mute hover:text-ink',
                                )}
                            >
                                {view.label}
                            </Link>
                        );
                    })}
                </nav>
            ) : null}
        </header>
    );
}

export function RecordHubPanel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <Card
            elevated={false}
            className={cn(
                'flex min-h-0 flex-1 flex-col overflow-hidden py-0',
                className,
            )}
            style={{ borderRadius: RECORD_HUB_RADIUS }}
        >
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                {children}
            </CardContent>
        </Card>
    );
}

export function RecordPageFrame({
    header,
    children,
}: {
    header: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="h-app-workspace flex flex-col bg-canvas-soft text-ui text-ink">
            <div className="relative shrink-0 border-b border-hairline bg-canvas px-4 py-2.5 sm:px-6">
                <span
                    className="absolute inset-y-0 left-0 w-[3px] bg-brand"
                    aria-hidden
                />
                {header}
            </div>
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
}: {
    title: string;
    initials?: string;
    kind?: string;
    subtitle?: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    actionsClassName?: string;
}) {
    return (
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
                <Avatar
                    size="md"
                    initials={initials || recordInitials(title) || '?'}
                    alt={title}
                    className="shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h1 className="text-record-title leading-snug font-semibold tracking-tight">
                            {title}
                        </h1>
                        {badge}
                        {kind ? (
                            <span className="text-[11px] text-mute">{kind}</span>
                        ) : null}
                    </div>
                    {subtitle ? (
                        <div className="text-[13px] leading-snug text-mute">
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

export function RecordFact({
    label,
    value,
    money = false,
    hideEmpty = true,
}: {
    label: string;
    value?: string | null;
    money?: boolean;
    hideEmpty?: boolean;
}) {
    if (hideEmpty && isEmptyFact(value)) {
        return null;
    }

    return (
        <div className="min-w-0">
            <p className="text-[11px] text-mute">{label}</p>
            <p
                className={cn(
                    'truncate text-[13px] text-ink',
                    money && 'money font-medium',
                )}
            >
                {isEmptyFact(value) ? '—' : value}
            </p>
        </div>
    );
}

export function RecordFactList({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-x-4 gap-y-2',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function RecordSection({
    title,
    action,
    children,
    className,
}: {
    title?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('space-y-2', className)}>
            {title ? (
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                        {t(title)}
                    </h3>
                    {action}
                </div>
            ) : null}
            <div className="space-y-2 text-[13px] leading-relaxed">
                {children}
            </div>
        </section>
    );
}

export function RecordTimelineItem({
    type,
    title,
    at,
    author,
    children,
}: {
    type: string;
    title?: ReactNode;
    at?: string | null;
    author?: string | null;
    children?: ReactNode;
}) {
    const when = formatRecordWhen(at);

    return (
        <article className="border-b border-hairline py-2.5 last:border-b-0">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-medium tracking-wide text-mute capitalize">
                    {type}
                </p>
                {when ? (
                    <time className="shrink-0 text-[11px] text-mute" dateTime={at ?? undefined}>
                        {when}
                    </time>
                ) : null}
            </div>
            {title ? (
                <p className="mt-0.5 text-[13px] font-medium text-ink">{title}</p>
            ) : null}
            {author ? <p className="text-[11px] text-mute">{author}</p> : null}
            {children}
        </article>
    );
}

export function RecordStatusBadge({ children }: { children: ReactNode }) {
    return <Badge variant="outline">{children}</Badge>;
}

export function RecordNextAction({
    title,
    detail,
    action,
}: {
    title: string;
    detail?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
            <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-mute uppercase">
                    Next
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{title}</p>
                {detail ? (
                    <p className="text-[11px] text-mute">{detail}</p>
                ) : null}
            </div>
            {action}
        </div>
    );
}

export function RecordDisclose({
    label,
    closeLabel = 'Close',
    children,
}: {
    label: string;
    closeLabel?: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                {open ? closeLabel : label}
            </Button>
            {open ? children : null}
        </div>
    );
}
