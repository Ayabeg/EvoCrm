import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/components/page-header';
import { formatDzd } from '@/components/crm/hub-chrome';
import { EvoVizChart } from '@/evoviz';
import type { EvoVizPayload } from '@/evoviz';

type KpiFormat = 'number' | 'money' | 'percent';

type ReportKpi = {
    label: string;
    value: number | null;
    format?: KpiFormat;
    hint?: string;
};

type ReportColumn = {
    key: string;
    label: string;
    format?: KpiFormat | 'text';
    align?: 'left' | 'right';
};

type ReportTable = {
    columns: ReportColumn[];
    rows: (string | number | null)[][];
};

type ReportCategory = {
    key: string;
    title: string;
    description?: string;
    kpis: ReportKpi[];
    charts: EvoVizPayload[];
    table: ReportTable | null;
};

type Props = {
    window: {
        from: string;
        to: string;
        days: number;
        timezone: string;
        custom: boolean;
    };
    categories: ReportCategory[];
};

const NUMBER = new Intl.NumberFormat('en-US');

function formatValue(
    value: number | null,
    format: KpiFormat = 'number',
): string {
    if (value === null) {
        return '—';
    }

    if (format === 'money') {
        return formatDzd(value);
    }

    if (format === 'percent') {
        return `${NUMBER.format(value)}%`;
    }

    return NUMBER.format(value);
}

function KpiStrip({ kpis }: { kpis: ReportKpi[] }) {
    if (kpis.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-canvas px-4 py-3">
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        {kpi.label}
                    </p>
                    <p className="money mt-1 text-xl font-semibold text-ink">
                        {formatValue(kpi.value, kpi.format)}
                    </p>
                    {kpi.hint ? (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {kpi.hint}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function BackingTable({ table }: { table: ReportTable }) {
    if (table.rows.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full">
                <thead className="bg-canvas-soft text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <tr>
                        {table.columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-3 py-2 font-medium ${column.align === 'right' ? 'text-right' : ''}`}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, i) => (
                        <tr key={i} className="border-t border-hairline">
                            {row.map((cell, j) => {
                                const column = table.columns[j];
                                const right = column?.align === 'right';

                                return (
                                    <td
                                        key={column?.key ?? j}
                                        className={`px-3 py-2 ${right ? 'money text-right' : ''} ${cell === null || cell === 0 ? 'text-muted-foreground' : ''}`}
                                    >
                                        {typeof cell === 'number'
                                            ? formatValue(
                                                  cell,
                                                  column?.format === 'text'
                                                      ? 'number'
                                                      : column?.format,
                                              )
                                            : (cell ?? '—')}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CategorySection({ category }: { category: ReportCategory }) {
    return (
        <section aria-label={category.title} className="mt-10 first:mt-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-sm font-medium text-ink">
                        {category.title}
                    </h2>
                    {category.description ? (
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {category.description}
                        </p>
                    ) : null}
                </div>
            </div>

            <KpiStrip kpis={category.kpis} />

            {category.charts.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {category.charts.map((chart) => (
                        <EvoVizChart
                            key={`${chart.id}-${chart.title}`}
                            payload={chart}
                        />
                    ))}
                </div>
            ) : null}

            {category.table ? (
                <div className="mt-3">
                    <BackingTable table={category.table} />
                </div>
            ) : null}
        </section>
    );
}

export default function Reports({ window, categories }: Props) {
    const [from, setFrom] = useState(window.from);
    const [to, setTo] = useState(window.to);

    const apply = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/reports', { from, to }, { preserveState: true });
    };

    const reset = () => {
        router.get('/reports', {}, { preserveState: true });
    };

    return (
        <>
            <Head title="Reports" />
            <div className="flex-1 bg-canvas-soft text-[13px] text-ink">
                <div className="mx-auto w-full max-w-6xl px-5 py-8">
                    <PageHeader
                        title="Reports"
                        description={`${window.from} → ${window.to} · ${window.days} days · ${window.timezone}. Real rows only — empty categories stay hidden.`}
                    >
                        <form
                            onSubmit={apply}
                            className="flex items-end gap-2"
                            aria-label="Date window"
                        >
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
                            {window.custom ? (
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

                    {categories.length === 0 ? (
                        <div className="rounded-lg border border-hairline bg-canvas px-4 py-10 text-center">
                            <p className="text-sm font-medium">
                                Nothing to report in this window
                            </p>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                Deals, leads, outbound sends, ad rows,
                                conversations, and activities appear here as
                                soon as they exist — no placeholders.
                            </p>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <CategorySection
                                key={category.key}
                                category={category}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/reports' }],
};
