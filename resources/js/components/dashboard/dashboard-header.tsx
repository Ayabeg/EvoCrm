import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { DashboardContext } from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';

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
        <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-page-title font-semibold tracking-tight text-ink">
                        {t('Home')}
                    </h1>
                    <p className="mt-0.5 truncate text-[11px] leading-4 text-mute">
                        {subtitle}
                    </p>
                </div>
                {canCreate ? (
                    <Button asChild size="sm" className="h-8 shrink-0">
                        <Link href="/crm/deals?create=1">{t('New deal')}</Link>
                    </Button>
                ) : null}
            </div>
        </header>
    );
}
