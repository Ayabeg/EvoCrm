import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { ListView } from '@/components/crm/list-chrome';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Brand Book + Aurora surface radius for CRM record hubs. */
export const RECORD_HUB_RADIUS = 12;

export function recordInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
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
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col overflow-hidden border border-hairline bg-canvas',
                className,
            )}
            style={{ borderRadius: RECORD_HUB_RADIUS }}
        >
            {children}
        </div>
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
            <div className="shrink-0 border-b border-hairline bg-canvas px-4 py-4 sm:px-6 sm:py-5">
                {header}
            </div>
            {children}
        </div>
    );
}

export function RecordIdentity({
    title,
    initials,
    subtitle,
    meta,
    badge,
    actions,
}: {
    title: string;
    initials?: string;
    subtitle?: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="mt-3 flex items-start gap-3">
            <Avatar
                size="lg"
                initials={initials || recordInitials(title) || '?'}
                alt={title}
                className="shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-record-title leading-snug font-semibold tracking-tight">
                        {title}
                    </h1>
                    {badge}
                </div>
                {subtitle ? (
                    <div className="text-[13px] leading-relaxed text-mute">
                        {subtitle}
                    </div>
                ) : null}
                {meta}
                {actions ? <div className="pt-3">{actions}</div> : null}
            </div>
        </div>
    );
}

export function RecordFact({
    label,
    value,
    money = false,
}: {
    label: string;
    value: string;
    money?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] text-mute">{label}</p>
            <p
                className={cn(
                    'truncate text-[13px] text-ink',
                    money && 'money font-medium',
                )}
            >
                {value}
            </p>
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
        <Card
            elevated={false}
            className={cn('overflow-hidden py-0', className)}
            style={{ borderRadius: RECORD_HUB_RADIUS }}
        >
            {title ? (
                <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                    <CardTitle as="h3" className="text-[12px] tracking-wide">
                        {title}
                    </CardTitle>
                    {action}
                </CardHeader>
            ) : null}
            <CardContent className="space-y-3 py-3 text-[13px] leading-relaxed">
                {children}
            </CardContent>
        </Card>
    );
}

export function RecordTimelineItem({
    type,
    title,
    children,
}: {
    type: string;
    title?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <article
            className="border border-hairline bg-canvas px-3 py-2.5"
            style={{ borderRadius: RECORD_HUB_RADIUS }}
        >
            <p className="text-[11px] font-medium text-mute capitalize">
                {type}
            </p>
            {title ? <p className="font-medium text-ink">{title}</p> : null}
            {children}
        </article>
    );
}

export function RecordStatusBadge({ children }: { children: ReactNode }) {
    return <Badge variant="default">{children}</Badge>;
}
