import { lazy, Suspense } from 'react';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatMoneyFromCents, formatNumber } from '@/evo/lib/format';
import { statusTone } from '@/evo/outbound/status';
import { SkeletonRow } from '@/evo/ui/skeleton';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

const ReportsChart = lazy(() => import('@/evo/outbound/ReportsChart'));

export type OutboundReportsProps = {
    totals: Record<string, number>;
    perSequence: Array<{
        id: number | string;
        name: string;
        enrollments: number;
        sent: number;
        opened: number;
        replied: number;
        delivered?: number;
        complained?: number;
        bounced?: number;
    }>;
    perCampaign: Array<{
        id: number | string;
        name: string;
        status: string;
        audience_count: number;
        sent: number;
        opened: number;
        replied: number;
        delivered?: number;
        complained?: number;
        won_deals?: number;
        won_revenue_cents?: number;
    }>;
    daily: Array<{ day: string; sent: number; opened?: number }>;
    onOpenCampaign?: (id: string | number) => void;
    onOpenSequence?: (id: string | number) => void;
};

export function OutboundReports({
    totals,
    perSequence,
    perCampaign,
    daily,
    onOpenCampaign,
    onOpenSequence,
}: OutboundReportsProps) {
    const campaignColumns: EvoDataGridColumn<(typeof perCampaign)[number]>[] = [
        {
            id: 'name',
            header: t('Campaign'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <button
                    type="button"
                    className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                    onClick={() => onOpenCampaign?.(row.original.id)}
                >
                    {row.original.name}
                </button>
            ),
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) => (
                <Status
                    tone={statusTone(row.original.status)}
                    label={t(row.original.status)}
                />
            ),
        },
        {
            id: 'sent',
            header: t('Sent'),
            accessorFn: (row) => row.sent,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatNumber(row.original.sent)}
                </span>
            ),
        },
        {
            id: 'replied',
            header: t('Replied'),
            accessorFn: (row) => row.replied,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatNumber(row.original.replied)}
                </span>
            ),
        },
        {
            id: 'delivered',
            header: t('Delivered'),
            accessorFn: (row) => row.delivered ?? 0,
            cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.delivered ?? 0)}</span>,
        },
        {
            id: 'complained',
            header: t('Complaints'),
            accessorFn: (row) => row.complained ?? 0,
            cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.complained ?? 0)}</span>,
        },
        {
            id: 'won_revenue',
            header: t('Won revenue'),
            accessorFn: (row) => row.won_revenue_cents ?? 0,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatMoneyFromCents(row.original.won_revenue_cents ?? 0)}
                </span>
            ),
        },
    ];

    const sequenceColumns: EvoDataGridColumn<(typeof perSequence)[number]>[] = [
        {
            id: 'name',
            header: t('Sequence'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <button
                    type="button"
                    className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                    onClick={() => onOpenSequence?.(row.original.id)}
                >
                    {row.original.name}
                </button>
            ),
        },
        {
            id: 'enrolled',
            header: t('Enrolled'),
            accessorFn: (row) => row.enrollments,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatNumber(row.original.enrollments)}
                </span>
            ),
        },
        {
            id: 'sent',
            header: t('Sent'),
            accessorFn: (row) => row.sent,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {formatNumber(row.original.sent)}
                </span>
            ),
        },
    ];

    return (
        <section className="space-y-4">
            <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                {t('Outbound operations')}
            </h2>
            <div className="grid gap-3 md:grid-cols-4">
                {Object.entries(totals)
                    .slice(0, 4)
                    .map(([key, value]) => (
                        <div
                            key={key}
                            className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-3"
                        >
                            <p className="text-[11px] text-[var(--evo-ink-muted)] uppercase">
                                {t(key)}
                            </p>
                            <p className="text-[18px] font-semibold text-[var(--evo-ink)] tabular-nums">
                                {formatNumber(value)}
                            </p>
                        </div>
                    ))}
            </div>
            {daily.length > 0 ? (
                <div className="h-56 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-3">
                    <Suspense fallback={<SkeletonRow />}>
                        <ReportsChart daily={daily} />
                    </Suspense>
                </div>
            ) : null}
            {perCampaign.length > 0 ? (
                <DataGrid
                    columns={campaignColumns}
                    data={perCampaign}
                    getRowId={(row) => `c-${row.id}`}
                    density="compact"
                    enableSelection={false}
                />
            ) : null}
            {perSequence.length > 0 ? (
                <DataGrid
                    columns={sequenceColumns}
                    data={perSequence}
                    getRowId={(row) => `s-${row.id}`}
                    density="compact"
                    enableSelection={false}
                />
            ) : null}
        </section>
    );
}
