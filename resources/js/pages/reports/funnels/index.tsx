import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ReportsShell } from '@/components/crm/reports-shell';
import { CrmKpiStrip, type KpiTile } from '@/components/crm/crm-kpi-strip';
import {
    FunnelStageBoard,
    type FunnelStageRow,
} from '@/components/funnels/funnel-stage-board';
import {
    SourceBreakdownTable,
    type SourceBreakdownRow,
} from '@/components/funnels/source-breakdown-table';

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
        cpl_cents: number | null;
        conversion_rate: number | null;
    };
    sources: SourceBreakdownRow[];
};

type Props = {
    funnels: FunnelSummary[];
    report: ReportPayload;
    custom: boolean;
};

export default function ConversionFunnels({
    funnels,
    report,
    custom,
}: Props) {
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
        router.get('/reports/funnels', { funnel: funnelId }, {
            preserveState: true,
        });
    };

    const kpis: KpiTile[] = [
        {
            key: 'spend',
            label: 'Ad spend',
            value: report.kpis.spend_cents,
            format: 'money',
            hint: 'Total source spend in window',
        },
        {
            key: 'visits',
            label: 'Visits',
            value: report.kpis.visits,
            hint: 'Top-of-funnel traffic',
        },
        {
            key: 'orders',
            label: 'Orders',
            value: report.kpis.orders,
            hint: 'Bottom-of-funnel conversions',
        },
        {
            key: 'cpl',
            label: 'Cost per lead',
            value: report.kpis.cpl_cents,
            format: 'money',
            hint: report.kpis.cpl_cents !== null ? 'Spend ÷ visits' : 'No visits in window',
        },
        {
            key: 'cr',
            label: 'Visit → order',
            value: report.kpis.conversion_rate,
            format: 'percent',
            hint: report.kpis.conversion_rate !== null ? 'Conversion rate' : 'No visits to convert',
        },
    ];

    const filterForm = (
        <form
            onSubmit={apply}
            className="flex flex-wrap items-end gap-2"
            aria-label="Funnel filters"
        >
            <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Funnel
                <select
                    value={funnelId}
                    onChange={(event) => setFunnelId(event.target.value)}
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                >
                    {funnels.map((funnel) => (
                        <option key={funnel.id} value={funnel.id}>
                            {funnel.name}
                            {funnel.is_default ? ' (default)' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                From
                <input
                    type="date"
                    value={from}
                    max={to}
                    onChange={(event) => setFrom(event.target.value)}
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                />
            </label>
            <label className="grid gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                To
                <input
                    type="date"
                    value={to}
                    min={from}
                    onChange={(event) => setTo(event.target.value)}
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] normal-case text-ink"
                />
            </label>
            <button
                type="submit"
                className="h-8 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
                Apply
            </button>
            {custom ? (
                <button
                    type="button"
                    onClick={reset}
                    className="h-8 rounded-md border border-hairline bg-canvas px-3 text-[13px] text-muted-foreground transition-colors hover:text-ink"
                >
                    Last 30 days
                </button>
            ) : null}
        </form>
    );

    return (
        <>
            <ReportsShell
                title="Conversion funnels"
                pageTitle="Conversion funnels"
                description={`${report.window.from} → ${report.window.to} · ${report.window.days} days · ${report.window.timezone}. Stage drop-off with source spend and CPL.`}
                filters={filterForm}
                footer={`Funnel: ${report.funnel.name} · Data window ${report.window.from} → ${report.window.to}`}
            >
                <CrmKpiStrip kpis={kpis} columns={5} />

                <section className="mt-8 space-y-3">
                    <h2 className="text-[13px] font-medium text-ink">
                        Stage conversion — where drop-off happens
                    </h2>
                    <div className="rounded-lg border border-hairline bg-canvas p-4">
                        <FunnelStageBoard stages={report.stages} />
                    </div>
                </section>

                <section className="mt-8 space-y-3">
                    <h2 className="text-[13px] font-medium text-ink">
                        Source breakdown — which channels convert
                    </h2>
                    <SourceBreakdownTable rows={report.sources} />
                </section>
            </ReportsShell>
        </>
    );
}

ConversionFunnels.layout = {
    breadcrumbs: [
        { title: 'Reports', href: '/reports' },
        { title: 'Conversion funnels', href: '/reports/funnels' },
    ],
};
