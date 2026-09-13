import { router } from '@inertiajs/react';
import ListViewTable from '@/components/crm/list-view-table';
import type { ListColumnDef, ListObjectType, ListViewColumn } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';
import type { DataTableProps } from '@/ds/workspace/types';

export function DataTable<Row extends { id: number }>({
    columns,
    rows,
    rowHeight = 48,
    selectedIds = [],
    onToggle,
    onRowClick,
}: DataTableProps<Row>) {
    const pageIds = rows.map((row) => row.id);
    const allSelected =
        pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    return (
        <div className="min-h-0 flex-1 overflow-auto" data-ds="data-table">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead>
                    <tr className="border-b border-hairline bg-canvas-soft text-left">
                        {onToggle ? (
                            <th className="w-10 px-4 md:px-8">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => {
                                        if (allSelected) {
                                            pageIds.forEach((id) => {
                                                if (selectedIds.includes(id)) {
                                                    onToggle(id);
                                                }
                                            });
                                            return;
                                        }

                                        pageIds.forEach((id) => {
                                            if (!selectedIds.includes(id)) {
                                                onToggle(id);
                                            }
                                        });
                                    }}
                                    aria-label="Select page"
                                />
                            </th>
                        ) : null}
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                className="px-4 text-[11px] font-medium text-mute md:px-8"
                                style={column.width ? { width: column.width } : undefined}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const selected = selectedIds.includes(row.id);

                        return (
                            <tr
                                key={row.id}
                                className={cn(
                                    'h-12 cursor-pointer border-b border-hairline hover:bg-canvas-soft',
                                    selected && 'bg-canvas-soft',
                                )}
                                style={{ height: rowHeight }}
                                onClick={(event) => {
                                    const target = event.target as HTMLElement;

                                    if (target.closest('a, input, button, label')) {
                                        return;
                                    }

                                    onRowClick?.(row);
                                }}
                            >
                                {onToggle ? (
                                    <td className="px-4 md:px-8">
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => onToggle(row.id)}
                                            aria-label={`Select ${row.id}`}
                                        />
                                    </td>
                                ) : null}
                                {columns.map((column) => (
                                    <td key={column.id} className="px-4 text-ink md:px-8">
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function ListDataTable({
    object,
    rows,
    columnDefs,
    columns,
    basePath,
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
}: {
    object: ListObjectType;
    rows: Array<{ id: number }>;
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
    selectable?: boolean;
    selectedIds?: number[];
    onToggle?: (id: number) => void;
    onTogglePage?: () => void;
}) {
    return (
        <div className="min-h-0 flex-1 overflow-auto" data-ds="data-table">
            <ListViewTable
                entity={object}
                rows={rows as never}
                columnDefs={columnDefs}
                columns={columns}
                basePath={basePath}
                selectable={selectable}
                selectedIds={selectedIds}
                onToggle={onToggle}
                onTogglePage={onTogglePage}
            />
        </div>
    );
}

export function visitRow(href: string): void {
    router.visit(href);
}
