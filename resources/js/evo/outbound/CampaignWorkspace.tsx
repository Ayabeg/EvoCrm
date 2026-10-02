import type { ReactNode } from 'react';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatDateTime, formatNumber } from '@/evo/lib/format';
import { OutboundSection } from '@/evo/outbound/section';
import { contactName, statusTone } from '@/evo/outbound/status';
import type { CampaignDetail, OutboundMessageRow } from '@/evo/outbound/types';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type CampaignWorkspaceProps = {
    campaign: CampaignDetail;
    messages: OutboundMessageRow[];
    scheduleForm?: ReactNode;
    actions?: ReactNode;
    onOpenContact?: (id: string | number) => void;
};

export function CampaignWorkspace({
    campaign,
    messages,
    scheduleForm,
    actions,
    onOpenContact,
}: CampaignWorkspaceProps) {
    const metrics: [string, number][] = [
        [t('Audience'), campaign.audience_count],
        [t('Suppressed (skipped)'), campaign.suppressed_count],
        [t('Sent'), campaign.counts.sent],
        [t('Pending'), campaign.counts.queued + campaign.counts.deferred],
        [t('Failed'), campaign.counts.failed],
        [t('Opened'), campaign.counts.opened],
        [t('Clicked'), campaign.counts.clicked],
        [t('Replied'), campaign.counts.replied],
    ];

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
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <div>
                    <Status tone={statusTone(row.original.status)} label={t(row.original.status)} />
                    {row.original.defer_reason ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--evo-ink-muted)]">
                            {t('deferred')} · {row.original.defer_reason.replaceAll('_', ' ')}
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
            accessorFn: (row) => (row.opened_at ? t('yes') : '—'),
        },
        {
            id: 'clicked',
            header: t('Clicked'),
            accessorFn: (row) => (row.clicked_at ? t('yes') : '—'),
        },
        {
            id: 'replied',
            header: t('Replied'),
            accessorFn: (row) => (row.replied_at ? t('yes') : '—'),
        },
        {
            id: 'sent',
            header: t('Sent'),
            accessorFn: (row) => row.sent_at ?? '—',
            cell: ({ row }) => (
                <span className="text-[12px] text-[var(--evo-ink-muted)]">
                    {row.original.sent_at ? formatDateTime(row.original.sent_at) : '—'}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {actions}
            <div className="grid gap-3 md:grid-cols-4">
                {metrics.map(([label, value]) => (
                    <div key={label} className="border-t border-[var(--evo-hairline)] py-2">
                        <p className="text-[11px] uppercase text-[var(--evo-ink-muted)]">{label}</p>
                        <p className="mt-1 text-[18px] font-semibold tabular-nums text-[var(--evo-ink)]">
                            {formatNumber(value)}
                        </p>
                    </div>
                ))}
            </div>

            {scheduleForm}

            <OutboundSection title={t('Content')}>
                <p className="text-[13px] text-[var(--evo-ink-secondary)]">
                    {t('Subject: :subject', { subject: campaign.subject ?? '—' })}
                </p>
                <p className="mt-2 whitespace-pre-wrap rounded-[var(--evo-radius-compact)] bg-[var(--evo-surface-subtle)] p-3 text-[13px] text-[var(--evo-ink-secondary)]">
                    {campaign.body}
                </p>
            </OutboundSection>

            <OutboundSection title={t('Messages')}>
                <DataGrid
                    columns={columns}
                    data={messages}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t('No messages yet — send now or wait for the schedule.')}
                />
            </OutboundSection>
        </div>
    );
}
