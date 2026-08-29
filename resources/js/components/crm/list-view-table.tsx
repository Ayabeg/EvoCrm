import { Link } from '@inertiajs/react';
import type { ListColumnDef, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, visibleColumns } from '@/lib/list-view-config';
import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

type AttributeMap = Record<string, string | null>;

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
    attributes?: AttributeMap;
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
    attributes?: AttributeMap;
};

type CompanyRow = {
    id: number;
    name: string;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    owner?: { name: string } | null;
    attributes?: AttributeMap;
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
            return customAttributeValue(row.attributes, columnId);
    }
}

function customAttributeValue(attributes: AttributeMap | undefined, columnId: string): string {
    if (!columnId.startsWith('custom:')) {
        return '—';
    }

    const value = attributes?.[columnId.slice(7)];

    return value == null || value === '' ? '—' : value;
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
            return customAttributeValue(row.attributes, columnId);
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
            return customAttributeValue(row.attributes, columnId);
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
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
}: {
    entity: 'contact' | 'deal' | 'company';
    rows: ContactRow[] | DealRow[] | CompanyRow[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
    selectable?: boolean;
    selectedIds?: number[];
    onToggle?: (id: number) => void;
    onTogglePage?: () => void;
}) {
    const visible = visibleColumns({
        columnDefs,
        filterFields: [],
        columns,
        sort: { field: 'created_at', direction: 'desc' },
    });
    const primaryId = primaryColumnId(entity);
    const pageIds = rows.map((row) => row.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    return (
        <div className="@container/list min-h-0 flex-1">
            {/* Desktop / tablet: Aurora-styled table in controlled scroll region */}
            <div className="hidden overflow-x-auto bg-canvas @[480px]/list:block">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                    <thead>
                        <tr className="border-b border-hairline bg-canvas-soft text-left">
                            {selectable ? (
                                <th className="w-10 px-4 py-1.5 sm:px-6">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={onTogglePage}
                                        aria-label="Select page"
                                    />
                                </th>
                            ) : null}
                            {visible.map((column) => (
                                <th
                                    key={column.id}
                                    className="px-4 py-1.5 text-[11px] font-medium text-mute first:sm:pl-6 last:sm:pr-6"
                                >
                                    {columnLabel(columnDefs, column.id)}
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
                                    'border-b border-hairline transition-colors hover:bg-canvas-soft',
                                    selected && 'bg-canvas-soft',
                                )}
                            >
                                {selectable ? (
                                    <td className="px-4 py-1.5 sm:px-6">
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => onToggle?.(row.id)}
                                            aria-label={`Select ${row.id}`}
                                        />
                                    </td>
                                ) : null}
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
                                        <td
                                            key={column.id}
                                            className={cn(
                                                'px-4 py-1.5 first:sm:pl-6 last:sm:pr-6',
                                                column.id === primaryId
                                                    ? 'font-medium text-ink'
                                                    : 'text-mute',
                                            )}
                                        >
                                            {column.id === primaryId ? (
                                                <Link
                                                    href={`${basePath}/${row.id}`}
                                                    className="font-medium text-ink hover:underline"
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile: prioritized card rows — no page-level horizontal scroll */}
            <ul className="divide-y divide-hairline @[480px]/list:hidden">
                {rows.map((row) => {
                    const primaryLabel =
                        entity === 'contact'
                            ? renderContactCell(primaryId, row as ContactRow)
                            : entity === 'deal'
                              ? renderDealCell(primaryId, row as DealRow)
                              : renderCompanyCell(primaryId, row as CompanyRow);

                    return (
                        <li key={row.id} className="flex items-start gap-2 px-4 py-2">
                            {selectable ? (
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={selectedIds.includes(row.id)}
                                    onChange={() => onToggle?.(row.id)}
                                    aria-label={`Select ${row.id}`}
                                />
                            ) : null}
                            <Link
                                href={`${basePath}/${row.id}`}
                                className="block min-w-0 flex-1 no-underline"
                            >
                                <p className="font-medium text-ink">{primaryLabel}</p>
                                <dl className="mt-1 grid gap-1 text-[11px]">
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
