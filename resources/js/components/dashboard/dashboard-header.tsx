import { Link } from '@inertiajs/react';
import { Button } from '@/evo/ui/button';
import type { DashboardContext } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { LONG_TEXT_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

export function DashboardHeader({
    context,
    canCreate = false,
}: {
    context: DashboardContext;
    canCreate?: boolean;
}) {
    const subtitle = [context.name, context.date, context.timezone]
        .filter(Boolean)
        .join(' · ');

    return (
        <header className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <h1
                    className={cn(
                        'text-[28px] leading-[34px] font-[650] tracking-tight text-ink',
                        LONG_TEXT_CLASS,
                    )}
                >
                    {t('Home')}
                </h1>
                <p className="mt-1 truncate text-[12px] leading-4 text-mute">{subtitle}</p>
            </div>
            {canCreate ? (
                <Button asChild variant="secondary" className="h-9 shrink-0">
                    <Link href="/crm/deals?create=1">{t('New deal')}</Link>
                </Button>
            ) : null}
        </header>
    );
}
