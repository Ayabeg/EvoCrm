import { DataGrid, DataGridRowAction } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { FilterBar } from '@/evo/data/filters';
import { formatPhone } from '@/evo/lib/format';
import type { SuppressionRow } from '@/evo/outbound/types';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type SuppressionListProps = {
    items: SuppressionRow[];
    search?: string;
    onSearchChange?: (value: string) => void;
    onRemove?: (item: SuppressionRow) => void;
};

export function SuppressionList({
    items,
    search,
    onSearchChange,
    onRemove,
}: SuppressionListProps) {
    const columns: EvoDataGridColumn<SuppressionRow>[] = [
        {
            id: 'type',
            header: t('Type'),
            accessorFn: (row) => row.type,
            cell: ({ row }) => (
                <Status
                    tone={row.original.type === 'email' ? 'info' : 'neutral'}
                    label={row.original.type === 'email' ? t('Email') : t('Phone')}
                />
            ),
        },
        {
            id: 'value',
            header: t('Value'),
            accessorFn: (row) => row.value,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {row.original.type === 'phone' ? formatPhone(row.original.value) : row.original.value}
                </span>
            ),
        },
        {
            id: 'reason',
            header: t('Reason'),
            accessorFn: (row) => row.reason ?? '—',
        },
    ];

    return (
        <div className="space-y-3">
            <FilterBar search={search} onSearchChange={onSearchChange} />
            <DataGrid
                columns={columns}
                data={items}
                getRowId={(row) => String(row.id)}
                density="compact"
                enableSelection={false}
                emptyTitle={t('Suppressed emails and phones never receive automated outbound — sequences skip them, campaigns fail them honestly, and the public unsubscribe link lands here.')}
                rowActions={
                    onRemove
                        ? (item) => (
                              <DataGridRowAction onClick={() => onRemove(item)}>
                                  {t('Remove')}
                              </DataGridRowAction>
                          )
                        : undefined
                }
            />
        </div>
    );
}
