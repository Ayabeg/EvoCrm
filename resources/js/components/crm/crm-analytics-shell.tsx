import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const REPORTS_TABS = [
    { label: 'Reports', href: '/reports' },
    { label: 'Funnels', href: '/reports/funnels' },
    { label: 'Report builder', href: '/crm/report-builder' },
] as const;

export function CrmAnalyticsNav({ active }: { active: string }) {
    return (
        <nav
            aria-label="Analytics"
            className="mb-6 flex flex-wrap gap-1 border-b border-hairline"
        >
            {REPORTS_TABS.map((tab) => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                        'border-b-2 px-3 pb-2.5 text-[13px] transition-colors',
                        tab.href === active ||
                            (active.startsWith('/crm/reports') && tab.href === '/reports') ||
                            (active.startsWith(`${tab.href}/`) && tab.href !== '/reports')
                            ? 'border-brand font-medium text-ink'
                            : 'border-transparent text-muted-foreground hover:text-ink',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}

export function CrmAnalyticsShell({
    active,
    title,
    description,
    filters,
    footer,
    children,
    hero,
}: {
    active: string;
    title: string;
    description?: string;
    filters?: ReactNode;
    footer?: ReactNode;
    hero?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex-1 bg-canvas-soft text-[13px] text-ink">
            <div className="mx-auto w-full max-w-7xl px-5 py-8">
                <CrmAnalyticsNav active={active} />
                {hero}
                <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-page-title font-semibold tracking-tight">
                            {title}
                        </h1>
                        {description ? (
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    {filters ? (
                        <div className="shrink-0">{filters}</div>
                    ) : null}
                </header>
                {children}
                {footer ? (
                    <footer className="mt-10 border-t border-hairline pt-4 text-[11px] text-muted-foreground">
                        {footer}
                    </footer>
                ) : null}
            </div>
        </div>
    );
}
