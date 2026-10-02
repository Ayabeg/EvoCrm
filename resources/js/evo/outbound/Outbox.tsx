import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { FilterBar } from '@/evo/data/filters';
import { formatDateTime } from '@/evo/lib/format';
import { contactName, statusTone } from '@/evo/outbound/status';
import type { OutboundMessageRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

const FILTERS = ['', 'queued', 'deferred', 'sent', 'failed'] as const;

export type OutboxProps = {
    messages: OutboundMessageRow[];
    status: string;
    counts: { queued: number; deferred: number; sent: number; failed: number };
    onFilter?: (status: string) => void;
    onOpenContact?: (id: string | number) => void;
    onOpenSequence?: (id: string | number) => void;
    onOpenCampaign?: (id: string | number) => void;
};

export function Outbox({
    messages,
    status,
    counts,
    onFilter,
    onOpenContact,
    onOpenSequence,
    onOpenCampaign,
}: OutboxProps) {
    const total = counts.queued + counts.deferred + counts.sent + counts.failed;

    const columns: EvoDataGridColumn<OutboundMessageRow>[] = [
        {
            id: 'to',
            header: t('To'),
            accessorFn: (row) => contactName(row.contact) || row.to_address,
            cell: ({ row }) => {
                const name = contactName(row.original.contact);

                return (
                    <div>
                        {row.original.contact && onOpenContact ? (
                            <button
                                type="button"
                                className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                                onClick={() => onOpenContact(row.original.contact!.id)}
                            >
                                {name}
                            </button>
                        ) : (
                            name || row.original.to_address
                        )}
                        <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                            {row.original.to_address}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'subject',
            header: t('Subject'),
            accessorFn: (row) => row.subject ?? '—',
            cell: ({ row }) => (
                <span>
                    {row.original.subject ?? '—'}
                    {row.original.replied_at ? (
                        <Status tone="success" label={t('replied')} className="ms-2" />
                    ) : null}
                </span>
            ),
        },
        {
            id: 'mailbox',
            header: t('Mailbox'),
            accessorFn: (row) => row.mailbox?.name ?? '—',
        },
        {
            id: 'source',
            header: t('Source'),
            cell: ({ row }) => {
                if (row.original.sequence && onOpenSequence) {
                    return (
                        <button
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenSequence(row.original.sequence!.id)}
                        >
                            {row.original.sequence.name}
                        </button>
                    );
                }

                if (row.original.campaign && onOpenCampaign) {
                    return (
                        <button
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenCampaign(row.original.campaign!.id)}
                        >
                            {row.original.campaign.name}
                        </button>
                    );
                }

                return '—';
            },
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <div>
                    <Status tone={statusTone(row.original.status)} label={t(row.original.status)} />
                    {row.original.defer_reason ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--evo-ink-muted)]">
                            {t('deferred · :reason until :until', {
                                reason: row.original.defer_reason.replaceAll('_', ' '),
                                until: row.original.deferred_until ?? t('later'),
                            })}
                        </span>
                    ) : null}
                    {row.original.failure_reason ? (
                        <span
                            className="mt-0.5 block max-w-64 truncate text-[11px] text-[var(--evo-ink)]"
                            title={row.original.failure_reason}
                        >
                            {row.original.failure_reason}
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'opened',
            header: t('Opened'),
            cell: ({ row }) =>
                row.original.opened_at
                    ? t('yes · :count×', { count: row.original.open_count ?? 1 })
                    : '—',
        },
        {
            id: 'clicked',
            header: t('Clicked'),
            cell: ({ row }) =>
                row.original.clicked_at
                    ? t('yes · :count×', { count: row.original.click_count ?? 1 })
                    : '—',
        },
        {
            id: 'sent',
            header: t('Sent'),
            cell: ({ row }) => (
                <span className="text-[12px] text-[var(--evo-ink-muted)]">
                    {formatDateTime(row.original.sent_at ?? row.original.created_at ?? new Date())}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-3">
            <FilterBar
                extra={
                    <div className="flex flex-wrap gap-1">
                        {FILTERS.map((filter) => (
                            <Button
                                key={filter || 'all'}
                                type="button"
                                size="sm"
                                variant={status === filter ? 'secondary' : 'ghost'}
                                aria-pressed={status === filter}
                                onClick={() => onFilter?.(filter)}
                            >
                                {t(':label (:count)', {
                                    label: filter === '' ? t('All') : t(filter),
                                    count:
                                        filter === ''
                                            ? total
                                            : counts[filter as keyof typeof counts],
                                })}
                            </Button>
                        ))}
                    </div>
                }
            />
            <DataGrid
                columns={columns}
                data={messages}
                getRowId={(row) => String(row.id)}
                density="compact"
                enableSelection={false}
                emptyTitle={t('Nothing here yet.')}
            />
        </div>
    );
}
