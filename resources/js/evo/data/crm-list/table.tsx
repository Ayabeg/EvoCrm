/**
 * Production CRM list table — ONE evo DataGrid (32/36px) + mobile cards.
 * Replaces the 48px ListViewTable. Identity / peek / URL contracts stay put.
 */
import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import LeadScorePill from '@/components/crm/lead-score-pill';
import { resolveRowActivation } from '@/ds/workspace/quick-record/row-peek';
import type { RowPeekContext } from '@/ds/workspace/quick-record/row-peek';
import { derivePageSelection, hasRowId } from '@/ds/workspace/selection';
import type { RowId } from '@/ds/workspace/selection';
import { resolveRowHref } from '@/ds/workspace/surface';
import {
    contactCommunicationHref,
    ListCell,
    primaryColumnId,
    renderListCell
    
    
} from '@/evo/data/crm-list/cells';
import type {ContactRow, ListRow} from '@/evo/data/crm-list/cells';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { DataGrid } from '@/evo/data/data-grid';
import { announce } from '@/evo/lib/a11y';
import { dataGridFr } from '@/evo/vendor/reui/data-grid/i18n';
import { t } from '@/lib/i18n';
import type { ListColumnDef, ListObjectType, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, visibleColumns } from '@/lib/list-view-config';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { LOCAL_SCROLL_X_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';
import { applyCompanyColumnContract, CompanyIdentityCell as CompanyNameCell } from '@/pages/crm/companies/company-columns';
import { applyContactColumnContract, ContactIdentityCell as ContactNameCell } from '@/pages/crm/contacts/contact-columns';
import {
    applyDealColumnContract,
    DealAmountCell,
    DealAttentionCell,
    DealIdentityCell as DealNameCell,
    DealStageCell,
} from '@/pages/crm/deals/deal-columns';
import type { DealListRow } from '@/pages/crm/deals/deal-columns';
import { applyLeadColumnContract, LeadIdentityCell as LeadNameCell, leadScorePayload } from '@/pages/crm/leads/lead-columns';
import type { LeadListRow } from '@/pages/crm/leads/lead-columns';
import {
    applyQuoteColumnContract,
    QuoteAmountCell,
    QuoteIdentityCell as QuoteNameCell,
    QuoteStatusCell,
} from '@/pages/crm/quotes/quote-columns';
import type { QuoteListRow } from '@/pages/crm/quotes/quote-columns';
import { applyTicketColumnContract, TicketIdentityCell } from '@/pages/crm/tickets/ticket-columns';
import type { TicketListRow } from '@/pages/crm/tickets/ticket-columns';

function activateListRow(
    event: {
        target: EventTarget | null;
        metaKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        button?: number;
        preventDefault?: () => void;
    },
    row: { id: RowId },
    href: string,
    opener: HTMLElement,
    onRowPeek?: (row: { id: RowId }, context?: RowPeekContext) => void,
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

const COMPANY_COLUMN_WIDTHS: Record<string, string> = {
    name: 'w-[36%]',
    city: 'w-[16%]',
    wilaya: 'w-[16%]',
    owner: 'w-[18%]',
    created_at: 'w-[14%]',
};

const LEAD_COLUMN_WIDTHS: Record<string, string> = {
    title: 'w-[40%]',
    contact: 'w-[22%]',
    status: 'w-[18%]',
    score: 'w-[20%]',
};

const DEAL_COLUMN_WIDTHS: Record<string, string> = {
    title: 'w-[24%]',
    stage: 'w-[11%]',
    amount: 'w-[12%]',
    close_date: 'w-[12%]',
    owner: 'w-[13%]',
    company: 'w-[14%]',
    contact: 'w-[14%]',
    attention: 'w-[12%]',
};

const QUOTE_COLUMN_WIDTHS: Record<string, string> = {
    title: 'w-[28%]',
    amount: 'w-[14%]',
    status: 'w-[10%]',
    owner: 'w-[16%]',
    created_at: 'w-[16%]',
    expires_at: 'w-[16%]',
};

function companyColumnWidth(columnId: string): string {
    return COMPANY_COLUMN_WIDTHS[columnId] ?? 'w-[14%]';
}

function leadColumnWidth(columnId: string): string {
    return LEAD_COLUMN_WIDTHS[columnId] ?? 'w-[14%]';
}

function dealColumnWidth(columnId: string): string {
    return DEAL_COLUMN_WIDTHS[columnId] ?? 'w-[12%]';
}

function quoteColumnWidth(columnId: string): string {
    return QUOTE_COLUMN_WIDTHS[columnId] ?? 'w-[14%]';
}

function widthClass(entity: ListObjectType, columnId: string): string | undefined {
    if (entity === 'company') {
        return companyColumnWidth(columnId);
    }

    if (entity === 'lead') {
        return leadColumnWidth(columnId);
    }

    if (entity === 'deal') {
        return dealColumnWidth(columnId);
    }

    if (entity === 'quote') {
        return quoteColumnWidth(columnId);
    }

    return undefined;
}

function announceSelection(count: number): void {
    announce(dataGridFr.rowsSelected.replace(':count', String(count)));
}

function asListRow(row: { id: RowId }): ListRow {
    return row as unknown as ListRow;
}

function asEntity<T>(row: { id: RowId }): T {
    return row as unknown as T;
}

export function CrmListTable<Row extends { id: RowId }>({
    entity,
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
    entity: ListObjectType;
    rows: Row[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
    rowHref?: (row: { id: RowId }) => string;
    onRowPeek?: (row: { id: RowId }, context?: RowPeekContext) => void;
    selectable?: boolean;
    selectedIds?: RowId[];
    onToggle?: (id: RowId) => void;
    onTogglePage?: () => void;
    isRowSelectable?: (id: RowId) => boolean;
}) {
    const resolvedDefs =
        entity === 'contact'
            ? applyContactColumnContract(columnDefs)
            : entity === 'company'
              ? applyCompanyColumnContract(columnDefs)
              : entity === 'lead'
                ? applyLeadColumnContract(columnDefs)
                : entity === 'deal'
                  ? applyDealColumnContract(columnDefs)
                  : entity === 'quote'
                    ? applyQuoteColumnContract(columnDefs)
                    : entity === 'ticket'
                      ? applyTicketColumnContract(columnDefs)
                      : columnDefs;
    const visible = visibleColumns({
        columnDefs: resolvedDefs,
        filterFields: [],
        columns,
        sort: { field: 'created_at', direction: 'desc' },
    });
    const primaryId = primaryColumnId(entity);
    const pageIds = rows.map((row) => row.id);
    const { allPageSelected, somePageSelected } = derivePageSelection(
        selectedIds,
        pageIds,
        { isRowSelectable },
    );

    const dealTable = entity === 'deal';
    const quoteTable = entity === 'quote';
    const fixedTable =
        entity === 'company' || entity === 'lead' || dealTable || quoteTable;

    const gridColumns = useMemo<EvoDataGridColumn<Row>[]>(() => {
        const selectColumn: EvoDataGridColumn<Row>[] = selectable
            ? [
                  {
                      id: '_select',
                      size: 40,
                      enableSorting: false,
                      enableResizing: false,
                      header: () => (
                          <input
                              type="checkbox"
                              checked={allPageSelected}
                              ref={(element) => {
                                  if (element) {
                                      element.indeterminate = somePageSelected;
                                  }
                              }}
                              onChange={onTogglePage}
                              aria-label="Select page"
                              aria-checked={
                                  somePageSelected
                                      ? 'mixed'
                                      : allPageSelected
                                        ? 'true'
                                        : 'false'
                              }
                          />
                      ),
                      cell: ({ row }) => (
                          <input
                              type="checkbox"
                              checked={hasRowId(selectedIds, row.original.id)}
                              disabled={!(isRowSelectable?.(row.original.id) ?? true)}
                              onChange={() => {
                                  onToggle?.(row.original.id);
                                  announceSelection(
                                      hasRowId(selectedIds, row.original.id)
                                          ? Math.max(0, selectedIds.length - 1)
                                          : selectedIds.length + 1,
                                  );
                              }}
                              aria-label={`Select ${row.original.id}`}
                          />
                      ),
                  } satisfies ColumnDef<Row, unknown> & { id: string },
              ]
            : [];

        const dataColumns = visible.map((column, index) => ({
            id: column.id,
            accessorFn: (row: Row) => renderListCell(entity, column.id, asListRow(row)),
            enableSorting: false,
            header: () => t(columnLabel(resolvedDefs, column.id)),
            meta: { widthClass: widthClass(entity, column.id), last: index === visible.length - 1 },
            cell: ({ row }: { row: { original: Row } }) => {
                const href = resolveRowHref(row.original, rowHref, basePath);
                const label = renderListCell(entity, column.id, asListRow(row.original));

                return (
                    <div
                        className={cn(
                            column.id === primaryId ? 'font-medium text-ink' : 'text-mute',
                            column.id === 'amount' && 'money tabular-nums text-ink',
                            quoteTable && column.id === 'amount' && 'text-right',
                            dealTable && column.id === 'close_date' && 'whitespace-nowrap',
                            fixedTable && column.id !== 'amount' && 'overflow-hidden',
                            widthClass(entity, column.id),
                        )}
                    >
                        <ListCell
                            entity={entity}
                            columnId={column.id}
                            row={asListRow(row.original)}
                            href={href}
                            label={label}
                        />
                    </div>
                );
            },
        }));

        return [...selectColumn, ...dataColumns];
    }, [
        allPageSelected,
        basePath,
        entity,
        isRowSelectable,
        onToggle,
        onTogglePage,
        primaryId,
        dealTable,
        quoteTable,
        resolvedDefs,
        rowHref,
        selectable,
        selectedIds,
        somePageSelected,
        visible,
        fixedTable,
    ]);

    return (
        <div className="@container/list min-h-0 min-w-0 flex-1">
            <div
                className={cn(
                    'hidden overflow-y-visible @[480px]/list:block',
                    LOCAL_SCROLL_X_CLASS,
                    'bg-canvas',
                )}
            >
                <DataGrid
                    columns={gridColumns}
                    data={rows}
                    getRowId={(row) => String(row.id)}
                    density="standard"
                    enableSelection={false}
                    pagination="none"
                    hideColumnPicker
                    embedded
                    enableSorting={false}
                    tableClassName={cn(
                        'border-collapse text-[13px]',
                        dealTable
                            ? 'table-fixed min-w-[68rem]'
                            : quoteTable
                              ? 'table-fixed min-w-[60rem]'
                              : fixedTable
                                ? 'table-fixed min-w-[52rem]'
                                : 'min-w-[640px]',
                    )}
                    rowClassName={cn(
                        'h-9',
                        MOTION_HOVER_CLASS,
                        'hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--color-focus-ring)]',
                    )}
                    getRowProps={(row) => {
                        const href = resolveRowHref(row, rowHref, basePath);
                        const selected = hasRowId(selectedIds, row.id);

                        return {
                            'aria-selected': selectable ? selected : undefined,
                            'data-row-peek': onRowPeek ? 'true' : undefined,
                            'aria-label': onRowPeek
                                ? `Inspect ${renderListCell(entity, primaryId, asListRow(row))}`
                                : undefined,
                            tabIndex: onRowPeek ? 0 : 0,
                            className: selected ? 'bg-[var(--evo-teal-soft)]' : undefined,
                            onClick: (event) => {
                                activateListRow(
                                    event,
                                    row,
                                    href,
                                    event.currentTarget,
                                    onRowPeek,
                                );
                            },
                            onAuxClick: (event) => {
                                activateListRow(
                                    event,
                                    row,
                                    href,
                                    event.currentTarget,
                                    onRowPeek,
                                );
                            },
                            onKeyDown: (event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') {
                                    return;
                                }

                                if (event.target !== event.currentTarget) {
                                    return;
                                }

                                if (event.key === ' ') {
                                    event.preventDefault();
                                }

                                activateListRow(
                                    event,
                                    row,
                                    href,
                                    event.currentTarget,
                                    onRowPeek,
                                );
                            },
                        };
                    }}
                    onRowActivate={(row, event) => {
                        const href = resolveRowHref(row, rowHref, basePath);
                        activateListRow(
                            event,
                            row,
                            href,
                            event.currentTarget as HTMLElement,
                            onRowPeek,
                        );
                    }}
                />
            </div>

            <ul className="divide-y divide-hairline @[480px]/list:hidden">
                {rows.map((row) => {
                    const primaryLabel = renderListCell(entity, primaryId, asListRow(row));
                    const href = resolveRowHref(row, rowHref, basePath);

                    return (
                        <li
                            key={row.id}
                            data-row-peek={onRowPeek ? 'true' : undefined}
                            className="flex cursor-pointer items-start gap-2 px-4 py-2"
                            onClick={(event) => {
                                activateListRow(
                                    event,
                                    row,
                                    href,
                                    event.currentTarget,
                                    onRowPeek,
                                );
                            }}
                        >
                            {selectable ? (
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={hasRowId(selectedIds, row.id)}
                                    disabled={!(isRowSelectable?.(row.id) ?? true)}
                                    onChange={() => onToggle?.(row.id)}
                                    aria-label={`Select ${row.id}`}
                                />
                            ) : null}
                            <div className="min-w-0 flex-1">
                                {entity === 'contact' ? (
                                    <ContactNameCell row={asEntity<ContactRow>(row)} href={href} />
                                ) : entity === 'company' ? (
                                    <CompanyNameCell
                                        row={asEntity<{ id: number; name: string; city?: string | null; wilaya?: string | null }>(row)}
                                        href={href}
                                    />
                                ) : entity === 'deal' ? (
                                    <DealNameCell row={asEntity<DealListRow>(row)} href={href} />
                                ) : entity === 'lead' ? (
                                    <LeadNameCell row={asEntity<LeadListRow>(row)} href={href} />
                                ) : entity === 'quote' ? (
                                    <QuoteNameCell row={asEntity<QuoteListRow>(row)} href={href} />
                                ) : entity === 'ticket' ? (
                                    <TicketIdentityCell
                                        row={asEntity<TicketListRow>(row)}
                                        href={href}
                                    />
                                ) : (
                                    <ListCell
                                        entity={entity}
                                        columnId={primaryId}
                                        row={asListRow(row)}
                                        href={href}
                                        label={primaryLabel}
                                    />
                                )}
                                {entity === 'lead' ? (
                                    <LeadScorePill compact score={leadScorePayload(asEntity<LeadListRow>(row))} />
                                ) : null}
                                {entity === 'deal' ? (
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <DealStageCell stage={asEntity<DealListRow>(row).stage} />
                                        <DealAmountCell cents={asEntity<DealListRow>(row).amount_cents} />
                                        <DealAttentionCell attention={asEntity<DealListRow>(row).attention} />
                                    </div>
                                ) : null}
                                {entity === 'quote' ? (
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <QuoteStatusCell
                                            status={asEntity<QuoteListRow>(row).status}
                                            statusLabel={asEntity<QuoteListRow>(row).status_label}
                                        />
                                        <QuoteAmountCell cents={asEntity<QuoteListRow>(row).total_cents} />
                                    </div>
                                ) : null}
                                <dl className="mt-1 grid gap-1 text-[11px]">
                                    {visible
                                        .filter((column) => column.id !== primaryId)
                                        .slice(0, 3)
                                        .map((column) => {
                                            const value = renderListCell(entity, column.id, asListRow(row));
                                            const communicationHref =
                                                entity === 'contact'
                                                    ? contactCommunicationHref(column.id, asEntity<ContactRow>(row))
                                                    : null;

                                            return (
                                                <div key={column.id} className="flex justify-between gap-3">
                                                    <dt className="text-muted-foreground">
                                                        {t(columnLabel(resolvedDefs, column.id))}
                                                    </dt>
                                                    <dd className="truncate text-ink">
                                                        {communicationHref ? (
                                                            <a href={communicationHref}>{value}</a>
                                                        ) : (
                                                            value
                                                        )}
                                                    </dd>
                                                </div>
                                            );
                                        })}
                                </dl>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default CrmListTable;
