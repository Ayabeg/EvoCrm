import { DataGrid, DataGridRowAction } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { FilterBar } from '@/evo/data/filters';
import { SavedViews } from '@/evo/data/saved-views';
import { statusTone } from '@/evo/outbound/status';
import type { CampaignRow } from '@/evo/outbound/types';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type CampaignListProps = {
    campaigns: CampaignRow[];
    search?: string;
    onSearchChange?: (value: string) => void;
    onOpen?: (campaign: CampaignRow) => void;
    onSendNow?: (campaign: CampaignRow) => void;
    onCancel?: (campaign: CampaignRow) => void;
};

export function CampaignList({
    campaigns,
    search,
    onSearchChange,
    onOpen,
    onSendNow,
    onCancel,
}: CampaignListProps) {
    const columns: EvoDataGridColumn<CampaignRow>[] = [
        {
            id: 'name',
            header: t('Campaign'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <button
                        type="button"
                        className="font-medium text-[var(--evo-ink)] underline-offset-2 hover:underline"
                        onClick={() => onOpen?.(row.original)}
                    >
                        {row.original.name}
                    </button>
                    <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                        {row.original.template
                            ? t('Template: :name', { name: row.original.template.name })
                            : t('Custom body')}
                        {row.original.scheduled_at &&
                        ['scheduled', 'draft'].includes(row.original.status)
                            ? t(' · scheduled :when', { when: row.original.scheduled_at })
                            : ''}
                    </span>
                </div>
            ),
        },
        {
            id: 'audience',
            header: t('Audience'),
            accessorFn: (row) => row.saved_filter?.name ?? t('All contacts with email'),
            cell: ({ row }) => (
                <div>
                    {row.original.saved_filter
                        ? row.original.saved_filter.name
                        : t('All contacts with email')}
                    {row.original.audience_count > 0 ? (
                        <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                            {t(':count reached', { count: row.original.audience_count })}
                            {row.original.suppressed_count > 0
                                ? t(' · :count suppressed', {
                                      count: row.original.suppressed_count,
                                  })
                                : ''}
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'mailbox',
            header: t('Mailbox'),
            accessorFn: (row) => row.mailbox?.name ?? t('Default'),
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <Status tone={statusTone(row.original.status)} label={t(row.original.status)} />
            ),
        },
        {
            id: 'progress',
            header: t('Progress'),
            cell: ({ row }) => (
                <span className="text-[12px] text-[var(--evo-ink-muted)]">
                    {t(
                        ':sent sent · :pending pending · :failed failed · :opened opened · :clicked clicked',
                        {
                            sent: row.original.counts.sent,
                            pending: row.original.counts.queued + row.original.counts.deferred,
                            failed: row.original.counts.failed,
                            opened: row.original.counts.opened,
                            clicked: row.original.counts.clicked,
                        },
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <SavedViews
                    views={[
                        { id: 'all', name: t('All') },
                        { id: 'live', name: t('sending') },
                        { id: 'draft', name: t('draft') },
                    ]}
                    activeViewId="all"
                />
                <FilterBar search={search} onSearchChange={onSearchChange} />
            </div>
            <DataGrid
                columns={columns}
                data={campaigns}
                getRowId={(row) => String(row.id)}
                density="compact"
                enableSelection={false}
                onRowClick={onOpen}
                emptyTitle={t(
                    'No campaigns yet. Create one above — pick a list, a template, and a mailbox.',
                )}
                rowActions={(campaign) => (
                    <>
                        {['draft', 'scheduled'].includes(campaign.status) && onSendNow ? (
                            <DataGridRowAction onClick={() => onSendNow(campaign)}>
                                {t('Send now')}
                            </DataGridRowAction>
                        ) : null}
                        {['draft', 'scheduled', 'sending'].includes(campaign.status) && onCancel ? (
                            <DataGridRowAction onClick={() => onCancel(campaign)}>
                                {t('Cancel')}
                            </DataGridRowAction>
                        ) : null}
                    </>
                )}
            />
        </div>
    );
}
