/**
 * Contacts presentation adapted from @tablecn/data-table.
 *
 * The registry component owns the bordered table layout, pinned-cell treatment,
 * header sort menu, and row state styling. EvoCRM continues to own the data
 * query, URL state, saved-view columns, selection, row activation, and pager.
 */
/* eslint-disable react-hooks/incompatible-library -- Tablecn is built on TanStack Table. */
import { router } from '@inertiajs/react';
import type { ColumnDef, ColumnPinningState, SortingState } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import { resolveRowActivation } from '@/ds/workspace/quick-record/row-peek';
import type { RowPeekContext } from '@/ds/workspace/quick-record/row-peek';
import { derivePageSelection, hasRowId } from '@/ds/workspace/selection';
import type { RowId } from '@/ds/workspace/selection';
import { ListCell, renderListCell } from '@/evo/data/crm-list/cells';
import type { ContactRow } from '@/evo/data/crm-list/cells';
import { ArrowsDownUp, CaretDown, CaretUp, EyeSlash, X } from '@/evo/icons';
import { announce } from '@/evo/lib/a11y';
import { Checkbox } from '@/evo/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/evo/ui/dropdown-menu';
import { t } from '@/lib/i18n';
import type { ListColumnDef, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, sortableColumnIds, visibleColumns } from '@/lib/list-view-config';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ContactIdentityCell } from '@/pages/crm/contacts/contact-columns';

const PINNED_CELL_CLASS_NAME = cn(
    'bg-[var(--evo-surface)] transition-colors',
    'group-hover/row:bg-[var(--evo-canvas-soft)]',
    'group-data-[state=selected]/row:bg-[var(--evo-teal-soft)]',
);

const CONTACT_COLUMN_SIZES: Record<string, number> = {
    _select: 44,
    name: 250,
    email: 220,
    phone: 150,
    lead_status: 140,
    company: 190,
    owner: 170,
    city: 140,
    wilaya: 140,
    last_activity_at: 150,
    created_at: 140,
};

function columnPinningStyle(column: {
    id: string;
    getIsPinned: () => false | 'left' | 'right';
    getStart: (position?: 'left' | 'right') => number;
    getAfter: (position?: 'left' | 'right') => number;
    getSize: () => number;
}): React.CSSProperties {
    const pinned = column.getIsPinned();

    return {
        insetInlineStart: pinned === 'left' ? column.getStart('left') : undefined,
        insetInlineEnd: pinned === 'right' ? column.getAfter('right') : undefined,
        opacity: pinned ? 0.98 : 1,
        position: pinned ? 'sticky' : 'relative',
        width: column.getSize(),
        zIndex: pinned ? 1 : undefined,
    };
}

function activateRow<Row extends { id: RowId }>(
    event: {
        target: EventTarget | null;
        metaKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        button?: number;
        preventDefault?: () => void;
    },
    row: Row,
    href: string,
    opener: HTMLElement,
    onRowPeek?: (row: Row, context?: RowPeekContext) => void,
): void {
    const target = event.target as HTMLElement;

    if (target.closest('a, input, button, label')) {
        return;
    }

    const action = resolveRowActivation({
        peekEnabled: Boolean(onRowPeek),
        nestedInteractive: false,
        metaOrCtrl: event.metaKey || event.ctrlKey,
        shiftOrAlt: event.shiftKey || event.altKey,
        middle: event.button === 1,
    });

    if (action === 'ignore') {
        return;
    }

    event.preventDefault?.();

    if (action === 'peek') {
        onRowPeek?.(row, { opener });

        return;
    }

    if (action === 'new-tab') {
        window.open(href, '_blank', 'noopener,noreferrer');

        return;
    }

    router.visit(href);
}

function TablecnColumnHeader({
    column,
    label,
}: {
    column: {
        getCanSort: () => boolean;
        getCanHide: () => boolean;
        getIsSorted: () => false | 'asc' | 'desc';
        toggleSorting: (desc?: boolean, isMulti?: boolean) => void;
        clearSorting: () => void;
        toggleVisibility: (value: boolean) => void;
        getIsVisible: () => boolean;
    };
    label: string;
}) {
    const sorted = column.getIsSorted();

    if (!column.getCanSort() && !column.getCanHide()) {
        return <div className="px-2">{label}</div>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    '-mx-2 inline-flex h-8 items-center gap-1.5 rounded-[var(--evo-radius-compact)] px-2 py-1.5 text-start hover:bg-[var(--evo-teal-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)]',
                    '[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-mute',
                )}
            >
                {label}
                {column.getCanSort() ? (
                    sorted === 'desc' ? (
                        <CaretDown aria-hidden />
                    ) : sorted === 'asc' ? (
                        <CaretUp aria-hidden />
                    ) : (
                        <ArrowsDownUp aria-hidden />
                    )
                ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
                {column.getCanSort() ? (
                    <>
                        <DropdownMenuCheckboxItem
                            checked={sorted === 'asc'}
                            onClick={() => column.toggleSorting(false)}
                        >
                            <CaretUp aria-hidden />
                            {t('Asc')}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={sorted === 'desc'}
                            onClick={() => column.toggleSorting(true)}
                        >
                            <CaretDown aria-hidden />
                            {t('Desc')}
                        </DropdownMenuCheckboxItem>
                        {sorted !== false ? (
                            <DropdownMenuItem onClick={() => column.clearSorting()}>
                                <X aria-hidden />
                                {t('Reset')}
                            </DropdownMenuItem>
                        ) : null}
                    </>
                ) : null}
                {column.getCanHide() ? (
                    <DropdownMenuCheckboxItem
                        checked={!column.getIsVisible()}
                        onClick={() => column.toggleVisibility(false)}
                    >
                        <EyeSlash aria-hidden />
                        {t('Hide')}
                    </DropdownMenuCheckboxItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export type TablecnContactsTableProps<Row extends { id: RowId }> = {
    rows: Row[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    rowHref: (row: Row) => string;
    onRowPeek?: (row: Row, context?: { opener?: HTMLElement | null }) => void;
    sort?: { id: string; dir: 'asc' | 'desc' };
    onSortChange?: (sort: { id: string; dir: 'asc' | 'desc' } | null) => void;
    selectable?: boolean;
    selectedIds?: RowId[];
    onToggle?: (id: RowId) => void;
    onTogglePage?: () => void;
    isRowSelectable?: (id: RowId) => boolean;
};

export function TablecnContactsTable<Row extends { id: RowId }>({
    rows,
    columnDefs,
    columns,
    rowHref,
    onRowPeek,
    sort,
    onSortChange,
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
    isRowSelectable,
}: TablecnContactsTableProps<Row>) {
    const resolvedDefs = columnDefs.map((column) =>
        column.id === 'name' ? { ...column, label: 'Contact' } : column,
    );
    const visible = visibleColumns({
        columnDefs: resolvedDefs,
        filterFields: [],
        columns,
        sort: { field: 'created_at', direction: 'desc' },
    });
    const pageIds = rows.map((row) => row.id);
    const { allPageSelected, somePageSelected } = derivePageSelection(
        selectedIds,
        pageIds,
        { isRowSelectable },
    );
    const [sorting, setSorting] = useState<SortingState>(
        sort ? [{ id: sort.id, desc: sort.dir === 'desc' }] : [],
    );

    useEffect(() => {
        setSorting(sort ? [{ id: sort.id, desc: sort.dir === 'desc' }] : []);
    }, [sort]);

    const selectColumn = useMemo<ColumnDef<Row, unknown>[]>(() => {
        if (!selectable) {
            return [];
        }

        return [
            {
                id: '_select',
                size: CONTACT_COLUMN_SIZES._select,
                minSize: CONTACT_COLUMN_SIZES._select,
                maxSize: CONTACT_COLUMN_SIZES._select,
                enableSorting: false,
                enableHiding: false,
                header: () => (
                    <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected}
                        onCheckedChange={onTogglePage}
                        aria-label={t('Select page')}
                    />
                ),
                cell: ({ row: tableRow }) => {
                    const id = tableRow.original.id;

                    return (
                        <Checkbox
                            checked={hasRowId(selectedIds, id)}
                            disabled={!(isRowSelectable?.(id) ?? true)}
                            onCheckedChange={() => {
                                onToggle?.(id);
                                announce(
                                    hasRowId(selectedIds, id)
                                        ? `Selected ${Math.max(0, selectedIds.length - 1)} rows.`
                                        : `Selected ${selectedIds.length + 1} rows.`,
                                );
                            }}
                            aria-label={t('Select :id', { id: String(id) })}
                        />
                    );
                },
            },
        ];
    }, [allPageSelected, isRowSelectable, onToggle, onTogglePage, selectable, selectedIds, somePageSelected]);

    const dataColumns = useMemo<ColumnDef<Row, unknown>[]>(
        () =>
            visible.map((column) => ({
                id: column.id,
                size: CONTACT_COLUMN_SIZES[column.id] ?? 150,
                minSize: 112,
                enableSorting: sortableColumnIds('contact').includes(column.id) && !!onSortChange,
                enableHiding: false,
                accessorFn: (row: Row) => renderListCell('contact', column.id, row as unknown as ContactRow),
                header: ({ column: tableColumn }) => (
                    <TablecnColumnHeader
                        column={tableColumn}
                        label={t(columnLabel(resolvedDefs, column.id))}
                    />
                ),
                cell: ({ row: tableRow }) => {
                    const row = tableRow.original;
                    const href = rowHref(row);
                    const label = renderListCell('contact', column.id, row as unknown as ContactRow);

                    if (column.id === 'name') {
                        return <ContactIdentityCell row={row as unknown as ContactRow} href={href} />;
                    }

                    return (
                        <span className="block min-w-0 truncate" title={label !== '—' ? label : undefined}>
                            <ListCell
                                entity="contact"
                                columnId={column.id}
                                row={row as unknown as ContactRow}
                                href={href}
                                label={label}
                            />
                        </span>
                    );
                },
            })),
        [onSortChange, resolvedDefs, rowHref, visible],
    );

    const columnsForTable = useMemo(
        () => [...selectColumn, ...dataColumns],
        [dataColumns, selectColumn],
    );
    const columnPinning: ColumnPinningState = useMemo(
        () => ({ left: selectable ? ['_select', 'name'] : ['name'] }),
        [selectable],
    );
    const table = useReactTable({
        data: rows,
        columns: columnsForTable,
        getRowId: (row) => String(row.id),
        state: { sorting, columnPinning },
        onSortingChange: (updater) => {
            const next = typeof updater === 'function' ? updater(sorting) : updater;
            setSorting(next);
            const active = next[0];
            onSortChange?.(
                active ? { id: active.id, dir: active.desc ? 'desc' : 'asc' } : null,
            );
        },
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        enableSorting: true,
        enableColumnPinning: true,
        enableSortingRemoval: true,
    });

    return (
        <div
            className="min-h-0 min-w-0 flex-1 overflow-auto"
            data-ds="data-table"
            data-tablecn="data-table"
            data-contact-tablecn="contacts"
        >
            <div className="overflow-hidden rounded-[var(--evo-radius-standard)] border border-hairline bg-[var(--evo-surface)]">
                <table
                    className="w-full table-fixed border-collapse text-[13px]"
                    style={{ minWidth: table.getTotalSize() }}
                >
                    <thead className="sticky top-0 z-10 bg-[var(--evo-surface)]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="group/row h-10 border-b border-hairline bg-canvas-soft">
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();

                                    return (
                                        <th
                                            key={header.id}
                                            data-contact-column={header.column.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                'overflow-hidden px-3 text-start text-[11px] font-medium text-mute',
                                                header.column.getIsPinned() && PINNED_CELL_CLASS_NAME,
                                            )}
                                            style={columnPinningStyle(header.column)}
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
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((tableRow) => {
                            const row = tableRow.original;
                            const selected = hasRowId(selectedIds, row.id);
                            const href = rowHref(row);

                            return (
                                <tr
                                    key={tableRow.id}
                                    data-contact-table-row
                                    data-state={selected ? 'selected' : undefined}
                                    data-row-peek={onRowPeek ? 'true' : undefined}
                                    tabIndex={0}
                                    className={cn(
                                        'group/row h-9 border-b border-hairline outline-none focus-visible:bg-[var(--evo-teal-soft)] focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] data-[state=selected]:bg-[var(--evo-teal-soft)]',
                                        MOTION_HOVER_CLASS,
                                        onRowPeek && 'cursor-pointer',
                                    )}
                                    aria-selected={selectable ? selected : undefined}
                                    aria-label={onRowPeek ? t('Inspect :label', { label: renderListCell('contact', 'name', row as unknown as ContactRow) }) : undefined}
                                    onClick={(event) => activateRow(event, row, href, event.currentTarget, onRowPeek)}
                                    onAuxClick={(event) => activateRow(event, row, href, event.currentTarget, onRowPeek)}
                                    onKeyDown={(event) => {
                                        if (event.target !== event.currentTarget) {
                                            return;
                                        }

                                        if (event.key === 'Enter' || event.key === ' ') {
                                            if (event.key === ' ') {
                                                event.preventDefault();
                                            }

                                            activateRow(event, row, href, event.currentTarget, onRowPeek);
                                        }
                                    }}
                                >
                                    {tableRow.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            data-contact-column={cell.column.id}
                                            dir="auto"
                                            className={cn(
                                                'overflow-hidden px-3 align-middle',
                                                cell.column.getIsPinned() && PINNED_CELL_CLASS_NAME,
                                            )}
                                            style={columnPinningStyle(cell.column)}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
