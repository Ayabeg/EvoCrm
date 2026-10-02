/**
 * Evo DataGrid — ONE grid (TanStack Table + Virtual).
 * Wraps vendored ReUI data-grid architecture. Pages must not import vendor/.
 */

/* eslint-disable react-hooks/incompatible-library -- TanStack Table is the approved DataGrid engine */
'use no memo';

import type {
    ColumnDef,
    ColumnPinningState,
    RowSelectionState,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

import { ArrowsDownUp, CaretDown, CaretLeft, CaretRight, CaretUp, Columns, DotsThreeVertical } from '@/evo/icons';
import { announce, sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { EmptyState } from '@/evo/patterns/empty-state';
import { ErrorState } from '@/evo/patterns/error-state';
import { Button } from '@/evo/ui/button';
import { Checkbox } from '@/evo/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { SkeletonRow } from '@/evo/ui/skeleton';
import { Spinner } from '@/evo/ui/spinner';
import { dataGridFr } from '@/evo/vendor/reui/data-grid/i18n';

export type EvoDataGridColumn<TData> = ColumnDef<TData, unknown> & {
    id: string;
};

export type EvoDataGridProps<TData> = {
    columns: EvoDataGridColumn<TData>[];
    data: TData[];
    getRowId: (row: TData) => string;
    density?: 'compact' | 'standard';
    enableSelection?: boolean;
    enableVirtualization?: boolean;
    /** Lab default is client. Production lists use `none` + WorkspacePaginator. */
    pagination?: 'client' | 'none';
    hideColumnPicker?: boolean;
    /** Production CRM lists: no lab toolbar, no client pager chrome. */
    embedded?: boolean;
    tableClassName?: string;
    enableSorting?: boolean;
    rowClassName?: string;
    getRowProps?: (row: TData) => React.HTMLAttributes<HTMLTableRowElement>;
    pageSize?: number;
    state?: 'ready' | 'loading' | 'empty' | 'error';
    errorMessage?: string;
    onRetry?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;
    selectedIds?: string[];
    onSelectedIdsChange?: (ids: string[]) => void;
    bulkActions?: React.ReactNode;
    rowActions?: (row: TData) => React.ReactNode;
    onRowClick?: (row: TData) => void;
    onRowActivate?: (row: TData, event: React.MouseEvent | React.KeyboardEvent) => void;
    sorting?: SortingState;
    onSortingChange?: (sorting: SortingState) => void;
    className?: string;
};

function EvoDataGridInner<TData>({
    columns,
    data,
    getRowId,
    density = 'standard',
    enableSelection = true,
    enableVirtualization = false,
    pagination = 'client',
    hideColumnPicker = false,
    embedded = false,
    tableClassName,
    enableSorting = true,
    rowClassName,
    getRowProps,
    pageSize = 25,
    state = 'ready',
    errorMessage,
    onRetry,
    emptyTitle = dataGridFr.noResults,
    emptyDescription,
    selectedIds,
    onSelectedIdsChange,
    bulkActions,
    rowActions,
    onRowClick,
    onRowActivate,
    sorting: sortingProp,
    onSortingChange,
    className,
}: EvoDataGridProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>(sortingProp ?? []);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const parentRef = React.useRef<HTMLDivElement>(null);
    const rowHeight = density === 'compact' ? 32 : 36;

    const selectionColumn = React.useMemo<ColumnDef<TData>[]>(() => {
        if (!enableSelection) {
            return [];
        }

        return [
            {
                id: '_select',
                size: 40,
                enableResizing: false,
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={table.getIsSomePageRowsSelected()}
                        aria-label={dataGridFr.selectAll}
                        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        aria-label={dataGridFr.selectRow}
                        onCheckedChange={(checked) => row.toggleSelected(checked)}
                    />
                ),
            },
        ];
    }, [enableSelection]);

    const actionColumn = React.useMemo<ColumnDef<TData>[]>(() => {
        if (!rowActions) {
            return [];
        }

        return [
            {
                id: '_actions',
                size: 44,
                enableResizing: false,
                header: () => <span className="sr-only">{dataGridFr.rowActions}</span>,
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={dataGridFr.rowActions}>
                                <DotsThreeVertical className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">{rowActions(row.original)}</DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ];
    }, [rowActions]);

    const table = useReactTable({
        data,
        columns: [...selectionColumn, ...columns, ...actionColumn],
        state: {
            sorting,
            columnVisibility,
            columnPinning,
            rowSelection,
        },
        getRowId,
        enableRowSelection: enableSelection,
        enableSorting: enableSorting && !embedded,
        enableColumnResizing: !embedded,
        columnResizeMode: 'onChange',
        onSortingChange: (updater) => {
            const next = typeof updater === 'function' ? updater(sorting) : updater;
            setSorting(next);
            onSortingChange?.(next);
        },
        onColumnVisibilityChange: setColumnVisibility,
        onColumnPinningChange: setColumnPinning,
        onRowSelectionChange: (updater) => {
            const next = typeof updater === 'function' ? updater(rowSelection) : updater;
            setRowSelection(next);
            onSelectedIdsChange?.(Object.keys(next).filter((id) => next[id]));
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel:
            enableVirtualization || pagination === 'none' ? undefined : getPaginationRowModel(),
        initialState: {
            pagination: { pageSize },
        },
    });

    React.useEffect(() => {
        if (!selectedIds) {
            return;
        }

        const next: RowSelectionState = {};
        selectedIds.forEach((id) => {
            next[id] = true;
        });
        setRowSelection(next);
    }, [selectedIds]);

    const rows = table.getRowModel().rows;
    const virtualizer = useVirtualizer({
        count: enableVirtualization ? rows.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 12,
    });

    const selectedCount = Object.keys(rowSelection).filter((id) => rowSelection[id]).length;

    React.useEffect(() => {
        if (!enableSelection) {
            return;
        }

        announce(dataGridFr.rowsSelected.replace(':count', String(selectedCount)));
    }, [enableSelection, selectedCount]);

    React.useEffect(() => {
        if (sortingProp) {
            setSorting(sortingProp);
        }
    }, [sortingProp]);

    if (state === 'loading') {
        return (
            <div className="space-y-1" aria-busy="true" aria-label={dataGridFr.loading}>
                {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonRow key={index} />
                ))}
                <Spinner label={dataGridFr.loading} />
            </div>
        );
    }

    if (state === 'error') {
        return <ErrorState title={dataGridFr.error} description={errorMessage} onRetry={onRetry} retryLabel={dataGridFr.retry} />;
    }

    if (state === 'empty' || rows.length === 0) {
        return <EmptyState title={emptyTitle} description={emptyDescription} density="panel" />;
    }

    const visibleRows = enableVirtualization ? virtualizer.getVirtualItems() : rows.map((row, index) => ({ index, start: index * rowHeight, size: rowHeight }));

    return (
        <div className={cn(embedded ? 'min-h-0 min-w-0 flex-1' : 'flex flex-col gap-2', className)} data-slot="data-grid">
            {embedded ? null : (
            <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] text-[var(--evo-ink-muted)]" aria-live="polite">
                    {dataGridFr.rowsSelected.replace(':count', String(selectedCount))}
                </p>
                {hideColumnPicker ? null : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Columns className="size-3.5" aria-hidden />
                            {dataGridFr.columns}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table.getAllLeafColumns()
                            .filter((column) => column.id !== '_select' && column.id !== '_actions')
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(checked) => column.toggleVisibility(checked)}
                                >
                                    {String(column.columnDef.header ?? column.id)}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
            )}

            {!embedded && selectedCount > 0 && bulkActions ? (
                <div
                    role="region"
                    aria-label={dataGridFr.bulk}
                    className="flex items-center gap-2 rounded-[var(--evo-radius-compact)] border border-hairline bg-[var(--evo-surface-subtle)] px-3 py-2"
                >
                    {bulkActions}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            table.resetRowSelection();
                            onSelectedIdsChange?.([]);
                        }}
                    >
                        {dataGridFr.clearSelection}
                    </Button>
                </div>
            ) : null}

            <div
                ref={parentRef}
                className={cn(
                    'relative overflow-auto',
                    embedded
                        ? 'border-y border-hairline'
                        : 'rounded-[var(--evo-radius-standard)] border border-hairline',
                )}
                style={enableVirtualization ? { maxHeight: 480 } : undefined}
            >
                <table className={cn('w-full caption-bottom text-[13px]', tableClassName)}>
                    <thead className="sticky top-0 z-10 bg-[var(--evo-surface)]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className={cn('h-9 border-b border-hairline', embedded && 'bg-canvas-soft')}>
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();
                                    const widthClass = (
                                        header.column.columnDef.meta as { widthClass?: string } | undefined
                                    )?.widthClass;
                                    const sized = header.column.columnDef.size != null;

                                    return (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                'relative px-3 text-start text-[11px] font-medium text-[var(--evo-ink-muted)]',
                                                widthClass,
                                            )}
                                            style={
                                                embedded && !sized
                                                    ? undefined
                                                    : {
                                                          width: header.getSize(),
                                                          minWidth: header.column.columnDef.minSize,
                                                      }
                                            }
                                            aria-sort={
                                                sorted === 'asc'
                                                    ? 'ascending'
                                                    : sorted === 'desc'
                                                      ? 'descending'
                                                      : header.column.getCanSort()
                                                        ? 'none'
                                                        : undefined
                                            }
                                        >
                                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    aria-label={
                                                        sorted === 'asc'
                                                            ? dataGridFr.sortDesc
                                                            : sorted === 'desc'
                                                              ? dataGridFr.clearSort
                                                              : dataGridFr.sortAsc
                                                    }
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {sorted === 'asc' ? (
                                                        <CaretUp className="size-3" aria-hidden />
                                                    ) : sorted === 'desc' ? (
                                                        <CaretDown className="size-3" aria-hidden />
                                                    ) : (
                                                        <ArrowsDownUp className="size-3 opacity-40" aria-hidden />
                                                    )}
                                                </button>
                                            ) : (
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            )}
                                            {header.column.getCanResize() ? (
                                                <div
                                                    role="separator"
                                                    aria-label={dataGridFr.resize}
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className="absolute end-0 top-0 h-full w-1 cursor-col-resize hover:bg-[var(--evo-teal)]"
                                                />
                                            ) : null}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody
                        style={
                            enableVirtualization
                                ? { height: virtualizer.getTotalSize(), position: 'relative' }
                                : undefined
                        }
                    >
                        {visibleRows.map((virtualRow) => {
                            const row = rows[virtualRow.index];

                            if (!row) {
                                return null;
                            }

                            const extraRowProps = getRowProps?.(row.original) ?? {};

                            return (
                                <tr
                                    key={row.id}
                                    data-state={row.getIsSelected() ? 'selected' : undefined}
                                    tabIndex={0}
                                    {...extraRowProps}
                                    onClick={(event) => {
                                        extraRowProps.onClick?.(event);

                                        if (event.defaultPrevented) {
                                            return;
                                        }

                                        onRowActivate?.(row.original, event);
                                        onRowClick?.(row.original);
                                    }}
                                    onKeyDown={(event) => {
                                        extraRowProps.onKeyDown?.(event);

                                        if (event.defaultPrevented) {
                                            return;
                                        }

                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            onRowActivate?.(row.original, event);
                                            onRowClick?.(row.original);
                                        }

                                        if (event.key === 'ArrowDown') {
                                            (event.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                                        }

                                        if (event.key === 'ArrowUp') {
                                            (event.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                                        }
                                    }}
                                    className={cn(
                                        'border-b border-hairline outline-none focus-visible:bg-[var(--evo-teal-soft)] focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] data-[state=selected]:bg-[var(--evo-teal-soft)]',
                                        (onRowClick || onRowActivate) && 'cursor-pointer',
                                        rowClassName,
                                        extraRowProps.className,
                                    )}
                                    style={{
                                        height: rowHeight,
                                        ...(enableVirtualization
                                            ? {
                                                  position: 'absolute',
                                                  top: 0,
                                                  transform: `translateY(${virtualRow.start}px)`,
                                                  width: '100%',
                                              }
                                            : {}),
                                        ...extraRowProps.style,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const widthClass = (
                                            cell.column.columnDef.meta as { widthClass?: string } | undefined
                                        )?.widthClass;
                                        const sized = cell.column.columnDef.size != null;

                                        return (
                                            <td
                                                key={cell.id}
                                                dir="auto"
                                                className={cn('px-3 align-middle', widthClass)}
                                                style={
                                                    embedded && !sized
                                                        ? undefined
                                                        : { width: cell.column.getSize() }
                                                }
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {enableVirtualization || pagination === 'none' ? null : (
                <nav className="flex items-center justify-between gap-2" aria-label={sr.pagination}>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        {dataGridFr.page} {table.getState().pagination.pageIndex + 1} {dataGridFr.of}{' '}
                        {table.getPageCount() || 1}
                    </p>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                            <CaretLeft className="size-3.5" aria-hidden />
                            {dataGridFr.previous}
                        </Button>
                        <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                            {dataGridFr.next}
                            <CaretRight className="size-3.5" aria-hidden />
                        </Button>
                    </div>
                </nav>
            )}
        </div>
    );
}

export const DataGrid = EvoDataGridInner;
export { DropdownMenuItem as DataGridRowAction };
