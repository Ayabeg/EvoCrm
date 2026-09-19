import { router } from '@inertiajs/react';
import ListViewTable from '@/components/crm/list-view-table';
import { derivePageSelection, hasRowId } from '@/ds/workspace/selection';
import type { RowId } from '@/ds/workspace/selection';
import type { DataTableProps } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';
import type { ListColumnDef, ListObjectType, ListViewColumn } from '@/lib/list-view-config';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function DataTable<Row extends { id: RowId }>({
    columns,
    rows,
    rowHeight = 48,
    selectedIds = [],
    onToggle,
    onTogglePage,
    onRowClick,
    isRowSelectable,
}: DataTableProps<Row>) {
    const pageIds = rows.map((row) => row.id);
    const { allPageSelected, somePageSelected } = derivePageSelection(
        selectedIds,
        pageIds,
        { isRowSelectable },
    );

    return (
        <div className="min-h-0 flex-1 overflow-auto" data-ds="data-table">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead>
                    <tr className="border-b border-hairline bg-canvas-soft text-left">
                        {onToggle ? (
                            <th className="w-10 px-4 md:px-8">
                                <input
                                    type="checkbox"
                                    checked={allPageSelected}
                                    ref={(element) => {
                                        if (element) {
                                            element.indeterminate = somePageSelected;
                                        }
                                    }}
                                    onChange={() => {
                                        if (onTogglePage) {
                                            onTogglePage();

                                            return;
                                        }

                                        if (allPageSelected) {
                                            pageIds.forEach((id) => {
                                                if (
                                                    (isRowSelectable?.(id) ?? true) &&
                                                    hasRowId(selectedIds, id)
                                                ) {
                                                    onToggle?.(id);
                                                }
                                            });

                                            return;
                                        }

                                        pageIds.forEach((id) => {
                                            if (
                                                (isRowSelectable?.(id) ?? true) &&
                                                !hasRowId(selectedIds, id)
                                            ) {
                                                onToggle?.(id);
                                            }
                                        });
                                    }}
                                    aria-label="Select page"
                                    aria-checked={
                                        somePageSelected
                                            ? 'mixed'
                                            : allPageSelected
                                              ? 'true'
                                              : 'false'
                                    }
                                />
                            </th>
                        ) : null}
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                className="px-4 text-[11px] font-medium text-mute md:px-8"
                                style={column.width ? { width: column.width } : undefined}
                            >
                                {t(column.label)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const selected = hasRowId(selectedIds, row.id);

                        const canSelect = isRowSelectable?.(row.id) ?? true;

                        return (
                            <tr
                                key={row.id}
                                aria-selected={onToggle ? selected : undefined}
                                className={cn(
                                    'h-12 cursor-pointer border-b border-hairline hover:bg-canvas-soft',
                                    MOTION_HOVER_CLASS,
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
                                            disabled={!canSelect}
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

export function ListDataTable<Row extends { id: RowId }>({
    object,
    rows,
    columnDefs,
    columns,
    basePath,
    rowHref,
    onRowPeek,
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
    isRowSelectable,
}: {
    object: ListObjectType;
    rows: Row[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
    rowHref: (row: Row) => string;
    onRowPeek?: (row: Row, context?: { opener?: HTMLElement | null }) => void;
    selectable?: boolean;
    selectedIds?: RowId[];
    onToggle?: (id: RowId) => void;
    onTogglePage?: () => void;
    isRowSelectable?: (id: RowId) => boolean;
}) {
    return (
        <div
            className={cn(
                'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
                (object === 'company' || object === 'lead' || object === 'deal' || object === 'quote') && '[scrollbar-gutter:stable]',
            )}
            data-ds="data-table"
        >
            <ListViewTable
                entity={object}
                rows={rows as never}
                columnDefs={columnDefs}
                columns={columns}
                basePath={basePath}
                rowHref={rowHref as (row: { id: RowId }) => string}
                onRowPeek={onRowPeek as (row: { id: RowId }, context?: { opener?: HTMLElement | null }) => void}
                selectable={selectable}
                selectedIds={selectedIds}
                onToggle={onToggle}
                onTogglePage={onTogglePage}
                isRowSelectable={isRowSelectable}
            />
        </div>
    );
}

export function visitRow(href: string): void {
    router.visit(href);
}
