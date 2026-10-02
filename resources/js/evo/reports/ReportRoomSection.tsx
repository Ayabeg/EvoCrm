import { BackingTable } from '@/evo/reports/BackingTable';
import { ChartFromPayload } from '@/evo/reports/ChartFromPayload';
import { ReportKpiRow } from '@/evo/reports/ReportKpiRow';
import type { ReportCategory } from '@/evo/reports/types';
import { t } from '@/lib/i18n';

export function ReportRoomSection({ category }: { category: ReportCategory }) {
    return (
        <section aria-label={t(category.title)} className="mt-6 first:mt-0">
            <div className="mb-3">
                <h2 className="text-[15px] font-semibold tracking-tight text-[var(--evo-ink)]">
                    {t(category.title)}
                </h2>
                {category.description ? (
                    <p className="mt-1 text-[12px] leading-5 text-[var(--evo-ink-muted)]">
                        {t(category.description)}
                    </p>
                ) : null}
            </div>

            <ReportKpiRow kpis={category.kpis} />

            {category.charts.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {category.charts.map((chart) => (
                        <ChartFromPayload key={`${chart.id}-${chart.title}`} payload={chart} />
                    ))}
                </div>
            ) : null}

            {category.table ? (
                <div className="mt-5">
                    <BackingTable table={category.table} />
                </div>
            ) : null}
        </section>
    );
}
