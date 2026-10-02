import type { ReactNode } from 'react';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatNumber } from '@/evo/lib/format';
import { OutboundSection } from '@/evo/outbound/section';
import { statusTone } from '@/evo/outbound/status';
import type { WarmupMailbox } from '@/evo/outbound/types';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Progress } from '@/evo/ui/progress';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type WarmupStatusProps = {
    mailboxes: WarmupMailbox[];
    systemMailboxes: Array<{
        id: number | string;
        name: string;
        from_address: string;
        enabled: boolean;
        opted_in: boolean;
    }>;
    ramp: number[];
    defaultCeiling: number;
    summary: { warming: number; active: number; sent_today: number; cap_today: number };
    renderActions?: (box: WarmupMailbox) => ReactNode;
    renderSystemActions?: (box: WarmupStatusProps['systemMailboxes'][number]) => ReactNode;
};

export function WarmupStatus({
    mailboxes,
    systemMailboxes,
    ramp,
    defaultCeiling,
    summary,
    renderActions,
    renderSystemActions,
}: WarmupStatusProps) {
    const systemColumns: EvoDataGridColumn<(typeof systemMailboxes)[number]>[] = [
        {
            id: 'mailbox',
            header: t('System mailbox'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <span className="font-medium text-[var(--evo-ink)]">{row.original.name}</span>
                    <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                        {row.original.from_address}
                    </span>
                </div>
            ),
        },
        {
            id: 'state',
            header: t('State'),
            accessorFn: (row) => (row.enabled ? t('enabled') : t('disabled')),
        },
        {
            id: 'actions',
            header: t('Actions'),
            enableSorting: false,
            cell: ({ row }) => renderSystemActions?.(row.original) ?? null,
        },
    ];

    return (
        <div className="space-y-4">
            <CrmKpiStrip
                columns={4}
                kpis={[
                    { key: 'warming', label: t('Warming'), value: summary.warming },
                    { key: 'active', label: t('Active'), value: summary.active },
                    {
                        key: 'sent',
                        label: t('Sent today'),
                        value: `${summary.sent_today}/${summary.cap_today}`,
                    },
                    {
                        key: 'ramp',
                        label: t('Ramp'),
                        value: t(':count days', { count: ramp.length }),
                        hint: t('then hold at ceiling'),
                    },
                ]}
            />

            <OutboundSection
                title={t('The ramp')}
                description={t(
                    'Caps above your ceiling are clamped to it. With the default ceiling of :ceiling, day 6 already holds. Start warmup on a box and the scheduled outbound:warmup command advances one plan day per Africa/Algiers date, writing the new daily_limit itself.',
                    { ceiling: defaultCeiling },
                )}
            >
                <div className="flex flex-wrap items-center gap-2">
                    {ramp.map((cap, index) => (
                        <span key={`${cap}-${index}`} className="flex items-center gap-2">
                            <span className="rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] px-2.5 py-1">
                                <span className="text-[11px] text-[var(--evo-ink-muted)]">
                                    {t('Day :day', { day: index + 1 })}
                                </span>{' '}
                                <span className="font-medium tabular-nums">
                                    {Math.min(cap, defaultCeiling)}
                                </span>
                            </span>
                            <span className="text-[var(--evo-ink-muted)]" aria-hidden>
                                →
                            </span>
                        </span>
                    ))}
                    <span className="rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] px-2.5 py-1 text-[var(--evo-ink)]">
                        {t('hold at your ceiling')}
                    </span>
                </div>
            </OutboundSection>

            {mailboxes.length === 0 ? (
                <p className="text-[13px] text-[var(--evo-ink-muted)]">
                    {t(
                        'No sendable mailbox yet - enable one under Outbound → Mailboxes, then start warmup here. System roles (abuse@, dmarc@, postmaster@, noreply@) stay hidden unless you opt them in below.',
                    )}
                </p>
            ) : (
                <div className="space-y-3">
                    {mailboxes.map((box) => {
                        const pct = box.cap > 0 ? Math.round((box.sent_today / box.cap) * 100) : 0;

                        return (
                            <article
                                key={box.id}
                                className="space-y-3 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-[13px] font-medium text-[var(--evo-ink)]">
                                            {box.name}
                                        </h3>
                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                            {box.from_name} &lt;{box.from_address}&gt;
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Status
                                            tone={statusTone(box.effective_status)}
                                            label={t(box.effective_status)}
                                        />
                                        {box.warming && box.day !== null ? (
                                            <Status tone="cyan" label={t('Day :n', { n: box.day })} />
                                        ) : null}
                                        {box.is_system ? (
                                            <Status tone="neutral" label={t('system role · opted in')} />
                                        ) : null}
                                        {box.peers ? (
                                            <Status tone="info" label={t('peer pings on')} />
                                        ) : null}
                                    </div>
                                </div>
                                <Progress value={pct} />
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    {(
                                        [
                                            [t("Today's cap"), formatNumber(box.cap)],
                                            [t('Sent today'), formatNumber(box.sent_today)],
                                            [t('Remaining'), formatNumber(box.remaining)],
                                            [t('Fail rate · 14d'), `${box.fail_rate}%`],
                                            [
                                                t("Tomorrow's cap"),
                                                box.warming && box.next_cap !== null
                                                    ? box.next_cap === box.cap
                                                        ? t(':cap · holds', { cap: box.cap })
                                                        : formatNumber(box.next_cap)
                                                    : '—',
                                            ],
                                        ] as [string, string][]
                                    ).map(([label, value]) => (
                                        <div key={label}>
                                            <p className="text-[11px] text-[var(--evo-ink-muted)]">{label}</p>
                                            <p className="mt-0.5 font-semibold tabular-nums text-[var(--evo-ink)]">
                                                {value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {renderActions?.(box)}
                            </article>
                        );
                    })}
                </div>
            )}

            {systemMailboxes.length > 0 ? (
                <OutboundSection
                    title={t('System mailboxes')}
                    description={t(
                        'abuse@, dmarc@, postmaster@ and noreply@ stay out of warmup unless you opt them in.',
                    )}
                >
                    <DataGrid
                        columns={systemColumns}
                        data={systemMailboxes}
                        getRowId={(row) => String(row.id)}
                        density="compact"
                        enableSelection={false}
                        emptyTitle={t('No system mailboxes.')}
                    />
                </OutboundSection>
            ) : null}
        </div>
    );
}
