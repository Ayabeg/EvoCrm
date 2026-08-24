import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { formatDzd } from '@/components/crm/hub-chrome';
import {
    FunnelStageBoard,
    type FunnelStageRow,
} from '@/components/funnels/funnel-stage-board';
import {
    SourceBreakdownTable,
    type SourceBreakdownRow,
} from '@/components/funnels/source-breakdown-table';
import PageHeader from '@/components/page-header';

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
            {
                from,
                to,
                funnel: funnelId,
            },
            { preserveState: true },
        );
    };

    const reset = () => {
        router.get('/reports/funnels', { funnel: funnelId }, {
            preserveState: true,
        });
    };

    return (
        <>
            <Head title="Conversion funnels" />
            <div className="flex-1 bg-canvas-soft text-[13px] text-ink">
                <div className="mx-auto w-full max-w-6xl px-5 py-8">
                    <PageHeader
                        title="Conversion funnels"
                        description={`${report.window.from} → ${report.window.to} · ${report.window.days} days · ${report.window.timezone}. Visits through delivery with source spend and CPL.`}
                    >
                        <form
                            onSubmit={apply}
                            className="flex flex-wrap items-end gap-2"
                            aria-label="Funnel filters"
                        >
                            <label className="grid gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                                Funnel
                                <select
                                    value={funnelId}
                                    onChange={(event) =>
                                        setFunnelId(event.target.value)
                                    }
                                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink normal-case"
                                >
                                    {funnels.map((funnel) => (
                                        <option
                                            key={funnel.id}
                                            value={funnel.id}
                                        >
                                            {funnel.name}
                                            {funnel.is_default
                                                ? ' (default)'
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                                From
                                <input
                                    type="date"
                                    value={from}
                                    max={to}
                                    onChange={(event) =>
                                        setFrom(event.target.value)
                                    }
                                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink normal-case"
                                />
                            </label>
                            <label className="grid gap-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                                To
                                <input
                                    type="date"
                                    value={to}
                                    min={from}
                                    onChange={(event) =>
                                        setTo(event.target.value)
                                    }
                                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink normal-case"
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
                    </PageHeader>

                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3 xl:grid-cols-5">
                        {[
                            ['Spend', formatDzd(report.kpis.spend_cents)],
                            [
                                'Visits',
                                report.kpis.visits.toLocaleString(),
                            ],
                            [
                                'Orders',
                                report.kpis.orders.toLocaleString(),
                            ],
                            [
                                'CPL',
                                report.kpis.cpl_cents !== null
                                    ? formatDzd(report.kpis.cpl_cents)
                                    : '—',
                            ],
                            [
                                'Visit → order',
                                report.kpis.conversion_rate !== null
                                    ? `${report.kpis.conversion_rate}%`
                                    : '—',
                            ],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-canvas px-4 py-3">
                                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                                    {label}
                                </p>
                                <p className="money mt-1 text-xl font-semibold text-ink">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <section className="mt-8 space-y-3">
                        <h2 className="text-sm font-medium text-ink">
                            {report.funnel.name}
                        </h2>
                        <div className="rounded-lg border border-hairline bg-canvas p-4">
                            <FunnelStageBoard stages={report.stages} />
                        </div>
                    </section>

                    <section className="mt-8 space-y-3">
                        <h2 className="text-sm font-medium text-ink">
                            Source breakdown
                        </h2>
                        <SourceBreakdownTable rows={report.sources} />
                    </section>
                </div>
            </div>
        </>
    );
}

ConversionFunnels.layout = {
    breadcrumbs: [
        { title: 'Reports', href: '/reports' },
        { title: 'Conversion funnels', href: '/reports/funnels' },
    ],
};
