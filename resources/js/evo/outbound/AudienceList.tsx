import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatNumber } from '@/evo/lib/format';
import type { AudienceListRow } from '@/evo/outbound/types';
import { t } from '@/lib/i18n';

export type AudienceListProps = {
    lists: AudienceListRow[];
    onOpenCampaign?: (id: string | number) => void;
    onOpenMembers?: (id: string | number) => void;
};

export function AudienceList({ lists, onOpenCampaign, onOpenMembers }: AudienceListProps) {
    const columns: EvoDataGridColumn<AudienceListRow>[] = [
        {
            id: 'name',
            header: t('List'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <span className="font-medium text-[var(--evo-ink)]">{row.original.name}</span>
            ),
        },
        {
            id: 'count',
            header: t('Contacts'),
            accessorFn: (row) => row.count,
            cell: ({ row }) => (
                <span className="tabular-nums">{formatNumber(row.original.count)}</span>
            ),
        },
        {
            id: 'campaigns',
            header: t('Campaigns'),
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                    {row.original.campaigns.map((campaign) => (
                        <button
                            key={campaign.id}
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenCampaign?.(campaign.id)}
                        >
                            {campaign.name}
                        </button>
                    ))}
                </div>
            ),
        },
        {
            id: 'open',
            header: t('Open'),
            enableSorting: false,
            cell: ({ row }) => (
                <button
                    type="button"
                    className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                    onClick={() => onOpenMembers?.(row.original.id)}
                >
                    {t('View')}
                </button>
            ),
        },
    ];

    return (
        <DataGrid
            columns={columns}
            data={lists}
            getRowId={(row) => String(row.id)}
            density="compact"
            enableSelection={false}
            emptyTitle={t('No contact segments yet.')}
        />
    );
}
