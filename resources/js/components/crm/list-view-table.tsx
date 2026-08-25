import { Link } from '@inertiajs/react';
import type { ListColumnDef, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, visibleColumns } from '@/lib/list-view-config';
import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

type ContactRow = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
};

type DealRow = {
    id: number;
    title: string;
    amount_cents?: number | null;
    close_date?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    stage?: { name: string } | null;
    company?: { name: string } | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    owner?: { name: string } | null;
};

type CompanyRow = {
    id: number;
    name: string;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    owner?: { name: string } | null;
};

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString();
}

function renderContactCell(columnId: string, row: ContactRow): string {
    switch (columnId) {
        case 'name':
            return `${row.first_name} ${row.last_name ?? ''}`.trim();
        case 'email':
            return row.email ?? '—';
        case 'phone':
            return row.phone_e164 ?? '—';
        case 'company':
            return row.company?.name ?? '—';
        case 'owner':
            return row.owner?.name ?? '—';
        case 'city':
            return row.city ?? '—';
        case 'wilaya':
            return row.wilaya ?? '—';
        case 'created_at':
            return formatDate(row.created_at);
        case 'last_activity_at':
            return formatDate(row.last_activity_at);
        default:
            return '—';
    }
}

function renderDealCell(columnId: string, row: DealRow): string {
    switch (columnId) {
        case 'title':
            return row.title;
        case 'amount':
            return formatDzd(row.amount_cents ?? 0);
        case 'stage':
            return row.stage?.name ?? '—';
        case 'company':
            return row.company?.name ?? '—';
        case 'contact':
            return row.contact
                ? `${row.contact.first_name} ${row.contact.last_name ?? ''}`.trim()
                : '—';
        case 'owner':
            return row.owner?.name ?? '—';
        case 'close_date':
            return formatDate(row.close_date);
        case 'created_at':
            return formatDate(row.created_at);
        case 'last_activity_at':
            return formatDate(row.last_activity_at);
        default:
            return '—';
    }
}

function renderCompanyCell(columnId: string, row: CompanyRow): string {
    switch (columnId) {
        case 'name':
            return row.name;
        case 'city':
            return row.city ?? '—';
        case 'wilaya':
            return row.wilaya ?? '—';
        case 'owner':
            return row.owner?.name ?? '—';
        case 'created_at':
            return formatDate(row.created_at);
        default:
            return '—';
    }
}

function primaryColumnId(entity: 'contact' | 'deal' | 'company'): string {
    return entity === 'deal' ? 'title' : 'name';
}

export default function ListViewTable({
    entity,
    rows,
    columnDefs,
    columns,
    basePath,
}: {
    entity: 'contact' | 'deal' | 'company';
    rows: ContactRow[] | DealRow[] | CompanyRow[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
}) {
    const visible = visibleColumns({
        columnDefs,
        filterFields: [],
        columns,
        sort: { field: 'created_at', direction: 'desc' },
    });
    const primaryId = primaryColumnId(entity);

    return (
        <div className="@container/list min-h-0 flex-1">
            {/* Desktop / tablet: Aurora-styled table in controlled scroll region */}
            <div className="hidden overflow-x-auto rounded-lg border border-hairline bg-canvas @[480px]/list:block">
                <table className="aurora-text-table w-full min-w-[640px] border-collapse">
                    <thead>
                        <tr className="border-b border-hairline bg-canvas-soft text-left">
                            {visible.map((column) => (
                                <th
                                    key={column.id}
                                    className="px-4 py-2.5 font-medium text-muted-foreground"
                                >
                                    {columnLabel(columnDefs, column.id)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-t border-hairline transition-colors hover:bg-canvas-soft/80"
                            >
                                {visible.map((column) => {
                                    const label =
                                        entity === 'contact'
                                            ? renderContactCell(column.id, row as ContactRow)
                                            : entity === 'deal'
                                              ? renderDealCell(column.id, row as DealRow)
                                              : renderCompanyCell(
                                                    column.id,
                                                    row as CompanyRow,
                                                );

                                    return (
                                        <td key={column.id} className="px-4 py-2.5">
                                            {column.id === primaryId ? (
                                                <Link
                                                    href={`${basePath}/${row.id}`}
                                                    className="font-medium text-brand hover:underline"
                                                >
                                                    {label}
                                                </Link>
                                            ) : (
                                                label
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: prioritized card rows — no page-level horizontal scroll */}
            <ul className="space-y-2 @[480px]/list:hidden">
                {rows.map((row) => {
                    const primaryLabel =
                        entity === 'contact'
                            ? renderContactCell(primaryId, row as ContactRow)
                            : entity === 'deal'
                              ? renderDealCell(primaryId, row as DealRow)
                              : renderCompanyCell(primaryId, row as CompanyRow);

                    return (
                        <li key={row.id}>
                            <Link
                                href={`${basePath}/${row.id}`}
                                className={cn(
                                    'block rounded-lg border border-hairline bg-canvas p-3 no-underline',
                                    'transition-colors hover:border-brand/40 hover:bg-canvas-soft',
                                )}
                            >
                                <p className="font-medium text-brand">{primaryLabel}</p>
                                <dl className="mt-2 grid gap-1.5 text-[12px]">
                                    {visible
                                        .filter((column) => column.id !== primaryId)
                                        .slice(0, 3)
                                        .map((column) => {
                                            const value =
                                                entity === 'contact'
                                                    ? renderContactCell(
                                                          column.id,
                                                          row as ContactRow,
                                                      )
                                                    : entity === 'deal'
                                                      ? renderDealCell(
                                                            column.id,
                                                            row as DealRow,
                                                        )
                                                      : renderCompanyCell(
                                                            column.id,
                                                            row as CompanyRow,
                                                        );

                                            return (
                                                <div
                                                    key={column.id}
                                                    className="flex justify-between gap-3"
                                                >
                                                    <dt className="text-muted-foreground">
                                                        {columnLabel(columnDefs, column.id)}
                                                    </dt>
                                                    <dd className="truncate text-ink">{value}</dd>
                                                </div>
                                            );
                                        })}
                                </dl>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
