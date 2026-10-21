import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ReportsShell } from '@/components/crm/reports-shell';
import { FunnelReport, ReportsFilters } from '@/evo/reports';
import type {
    CampaignAttributionRow,
    FunnelStageRow,
    SourceBreakdownRow,
} from '@/evo/reports';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

type FunnelSummary = {
    id: number;
    name: string;
    slug: string;
    is_default: boolean;
};

type ReportPayload = {
    funnel: { id: number; name: string; slug: string };
    window: {
        from: string;
        to: string;
        days: number;
        timezone: string;
    };
    stages: FunnelStageRow[];
    kpis: {
        spend_cents: number;
        visits: number;
        orders: number;
        meetings_booked: number;
        cpl_cents: number | null;
        conversion_rate: number | null;
    };
    sources: SourceBreakdownRow[];
    campaigns: CampaignAttributionRow[];
};

type Props = {
    funnels: FunnelSummary[];
    report: ReportPayload;
    custom: boolean;
};

export default function ConversionFunnels({ funnels, report, custom }: Props) {
    const [from, setFrom] = useState(report.window.from);
    const [to, setTo] = useState(report.window.to);
    const [funnelId, setFunnelId] = useState(String(report.funnel.id));

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/reports/funnels',
            { from, to, funnel: funnelId },
            { preserveState: true },
        );
    };

    const reset = () => {
        router.get(
            '/reports/funnels',
            { funnel: funnelId },
            { preserveState: true },
        );
    };

    return (
        <ReportsShell
            title="Conversion funnels"
            pageTitle="Conversion funnels"
            description={t(':from → :to · :days days · :timezone', {
                from: report.window.from,
                to: report.window.to,
                days: report.window.days,
                timezone: report.window.timezone,
            })}
            filters={
                <ReportsFilters
                    from={from}
                    to={to}
                    custom={custom}
                    onFrom={setFrom}
                    onTo={setTo}
                    onApply={apply}
                    onReset={reset}
                    ariaLabel={t('Funnel filters')}
                    extra={
                        <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                            {t('Funnel')}
                            <NativeSelect
                                value={funnelId}
                                onChange={(event) =>
                                    setFunnelId(event.target.value)
                                }
                                className="h-8"
                            >
                                {funnels.map((funnel) => (
                                    <option key={funnel.id} value={funnel.id}>
                                        {funnel.name}
                                        {funnel.is_default
                                            ? ` ${t('(default)')}`
                                            : ''}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                    }
                />
            }
            footer={`${t('Funnel')}: ${report.funnel.name} · ${report.window.from} → ${report.window.to}`}
        >
            <FunnelReport
                stages={report.stages}
                kpis={report.kpis}
                sources={report.sources}
                campaigns={report.campaigns}
            />
        </ReportsShell>
    );
}

ConversionFunnels.layout = {
    breadcrumbs: [
        { title: 'Reports', href: '/reports' },
        { title: 'Conversion funnels', href: '/reports/funnels' },
    ],
};
