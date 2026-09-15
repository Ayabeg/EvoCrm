import { Link, router } from '@inertiajs/react';
import { derivePageSelection, hasRowId } from '@/ds/workspace/selection';
import type { RowId } from '@/ds/workspace/selection';
import { resolveRowHref } from '@/ds/workspace/surface';
import { formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';
import type { ListColumnDef, ListObjectType, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, visibleColumns } from '@/lib/list-view-config';
import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
    applyContactColumnContract,
    ContactIdentityCell as ContactNameCell,
} from '@/pages/crm/contacts/contact-columns';

type AttributeMap = Record<string, string | null>;

type ContactRow = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    lead_status?: string | null;
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
    health?: { score: number; band?: string; label?: string } | null;
    next_step?: string | null;
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

type TicketRow = {
    id: number;
    number: string;
    subject: string;
    status: string;
    status_label?: string;
    priority?: string | null;
    channel?: string | null;
    channel_label?: string | null;
    created_at?: string | null;
    sla_due_at?: string | null;
    sla_label?: string | null;
    sla_breached?: boolean;
    contact?: { first_name: string; last_name?: string | null } | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
};

type QuoteRow = {
    id: number;
    title: string;
    status: string;
    status_label?: string;
    total_cents?: number | null;
    created_at?: string | null;
    expires_at?: string | null;
    sent_at?: string | null;
    owner?: { name: string } | null;
    deal?: { id: number; title: string } | null;
};

const ALGIERS = 'Africa/Algiers';

function formatDate(value?: string | null, withTime = false): string {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value.includes('T') || value.includes(' ') ? value.replace(' ', 'T') : `${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        timeZone: ALGIERS,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime
            ? { hour: '2-digit', minute: '2-digit', hour12: false }
            : {}),
    }).format(parsed);
}

function renderContactCell(columnId: string, row: ContactRow): string {
    switch (columnId) {
        case 'name':
            return formatContactName(row.first_name, row.last_name);
        case 'email':
            return row.email ?? '—';
        case 'phone':
            return row.phone_e164 ?? '—';
        case 'lead_status':
            return titleCase(row.lead_status);
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

function DealNameCell({
    row,
    href,
    linked = true,
}: {
    row: DealRow;
    href: string;
    linked?: boolean;
}) {
    const body = <span className="truncate">{row.title}</span>;

    if (!linked) {
        return (
            <span className="inline-flex min-w-0 items-center font-medium text-ink">
                {body}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className="inline-flex min-w-0 items-center font-medium text-ink hover:underline"
        >
            {body}
        </Link>
    );
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
                ? formatContactName(row.contact.first_name, row.contact.last_name)
                : '—';
        case 'owner':
            return row.owner?.name ?? '—';
        case 'close_date':
            return formatDate(row.close_date, true);
        case 'created_at':
            return formatDate(row.created_at);
        case 'last_activity_at':
            return formatDate(row.last_activity_at);
        case 'health':
            return row.health
                ? `${row.health.score} ${row.health.label ?? ''}`.trim()
                : '—';
        case 'next_step':
            return row.next_step ?? '—';
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

function titleCase(value?: string | null): string {
    if (!value) {
        return '—';
    }

    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderQuoteCell(columnId: string, row: QuoteRow): string {
    switch (columnId) {
        case 'title':
            return row.title || `Quote #${row.id}`;
        case 'amount':
            return formatDzd(row.total_cents ?? 0);
        case 'status':
            return row.status_label ?? titleCase(row.status);
        case 'owner':
            return row.owner?.name ?? '—';
        case 'created_at':
            return formatDate(row.created_at);
        case 'expires_at':
            return row.expires_at ? formatDate(row.expires_at) : 'No expiration';
        case 'sent_at':
            return formatDate(row.sent_at);
        default:
            return '—';
    }
}

function renderTicketCell(columnId: string, row: TicketRow): string {
    switch (columnId) {
        case 'number':
            return row.number;
        case 'subject':
            return row.subject;
        case 'status':
            return row.status_label ?? titleCase(row.status);
        case 'priority':
            return titleCase(row.priority);
        case 'channel':
            return row.channel_label ?? titleCase(row.channel);
        case 'contact':
            return row.contact
                ? `${row.contact.first_name} ${row.contact.last_name ?? ''}`.trim()
                : '—';
        case 'company':
            return row.company?.name ?? '—';
        case 'owner':
            return row.owner?.name ?? 'Unassigned';
        case 'created_at':
            return formatDate(row.created_at);
        case 'sla_due_at':
            return row.sla_label ?? formatDate(row.sla_due_at, true);
        default:
            return '—';
    }
}

function primaryColumnId(entity: ListObjectType): string {
    if (entity === 'deal') {
        return 'title';
    }

    if (entity === 'ticket') {
        return 'subject';
    }

    if (entity === 'quote') {
        return 'title';
    }

    return 'name';
}

function renderCell(
    entity: ListObjectType,
    columnId: string,
    row: ContactRow | DealRow | CompanyRow | TicketRow | QuoteRow,
): string {
    if (entity === 'contact') {
        return renderContactCell(columnId, row as ContactRow);
    }

    if (entity === 'deal') {
        return renderDealCell(columnId, row as DealRow);
    }

    if (entity === 'ticket') {
        return renderTicketCell(columnId, row as TicketRow);
    }

    if (entity === 'quote') {
        return renderQuoteCell(columnId, row as QuoteRow);
    }

    return renderCompanyCell(columnId, row as CompanyRow);
}

export default function ListViewTable({
    entity,
    rows,
    columnDefs,
    columns,
    basePath,
    rowHref,
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
    isRowSelectable,
}: {
    entity: ListObjectType;
    rows: ContactRow[] | DealRow[] | CompanyRow[] | TicketRow[] | QuoteRow[];
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    basePath: string;
    rowHref?: (row: { id: RowId }) => string;
    selectable?: boolean;
    selectedIds?: RowId[];
    onToggle?: (id: RowId) => void;
    onTogglePage?: () => void;
    isRowSelectable?: (id: RowId) => boolean;
}) {
    const resolvedDefs =
        entity === 'contact' ? applyContactColumnContract(columnDefs) : columnDefs;
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

    return (
        <div className="@container/list min-h-0 flex-1">
            {/* Desktop / tablet: Aurora-styled table in controlled scroll region */}
            <div
                className={cn(
                    'hidden overflow-x-auto @[480px]/list:block',
                    entity === 'contact' || entity === 'deal' ? 'bg-white' : 'bg-canvas',
                )}
            >
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                    <thead>
                        <tr className="h-12 border-b border-hairline bg-canvas-soft text-left">
                            {selectable ? (
                                <th className="w-10 px-4 md:px-8">
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
                                </th>
                            ) : null}
                            {visible.map((column) => (
                                <th
                                    key={column.id}
                                    className={cn(
                                        'h-12 px-4 font-medium text-mute md:px-8',
                                        entity === 'contact'
                                            ? 'text-[13px] leading-[18px]'
                                            : 'text-[11px]',
                                    )}
                                >
                                    {t(columnLabel(resolvedDefs, column.id))}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const selected = hasRowId(selectedIds, row.id);
                            const href = resolveRowHref(row, rowHref, basePath);

                            return (
                            <tr
                                key={row.id}
                                className={cn(
                                    entity === 'contact'
                                        ? 'min-h-12 cursor-pointer border-b border-hairline transition-colors hover:bg-canvas-soft'
                                        : 'h-12 cursor-pointer border-b border-hairline transition-colors hover:bg-canvas-soft',
                                    selected && 'bg-canvas-soft',
                                )}
                                onClick={(event) => {
                                    const target = event.target as HTMLElement;

                                    if (target.closest('a, input, button, label')) {
                                        return;
                                    }

                                    router.visit(href);
                                }}
                            >
                                {selectable ? (
                                    <td className={cn(entity === 'contact' ? 'min-h-12 py-2' : 'h-12', 'px-4 md:px-8')}>
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            disabled={
                                                !(isRowSelectable?.(row.id) ?? true)
                                            }
                                            onChange={() => onToggle?.(row.id)}
                                            aria-label={`Select ${row.id}`}
                                        />
                                    </td>
                                ) : null}
                                {visible.map((column) => {
                                    const label = renderCell(entity, column.id, row);
                                    const isContactName =
                                        entity === 'contact' &&
                                        column.id === 'name';
                                    const isDealName =
                                        entity === 'deal' &&
                                        column.id === 'title';

                                    return (
                                        <td
                                            key={column.id}
                                            className={cn(
                                                entity === 'contact' ? 'min-h-12 py-2' : 'h-12',
                                                'px-4 md:px-8',
                                                column.id === primaryId
                                                    ? 'font-medium text-ink'
                                                    : 'text-mute',
                                                column.id === 'amount' &&
                                                    'money tabular-nums text-ink',
                                            )}
                                        >
                                            {isContactName ? (
                                                <ContactNameCell
                                                    row={row as ContactRow}
                                                    href={href}
                                                />
                                            ) : isDealName ? (
                                                <DealNameCell
                                                    row={row as DealRow}
                                                    href={href}
                                                />
                                            ) : column.id === primaryId ? (
                                                <Link
                                                    href={href}
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
                    const primaryLabel = renderCell(entity, primaryId, row);
                    const href = resolveRowHref(row, rowHref, basePath);

                    return (
                        <li key={row.id} className="flex items-start gap-2 px-4 py-2">
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
                            <Link
                                href={href}
                                className="block min-w-0 flex-1 no-underline"
                            >
                                {entity === 'contact' ? (
                                    <ContactNameCell
                                        row={row as ContactRow}
                                        href={href}
                                        linked={false}
                                    />
                                ) : entity === 'deal' ? (
                                    <DealNameCell
                                        row={row as DealRow}
                                        href={href}
                                        linked={false}
                                    />
                                ) : (
                                    <p className="font-medium text-ink">
                                        {primaryLabel}
                                    </p>
                                )}
                                <dl className="mt-1 grid gap-1 text-[11px]">
                                    {visible
                                        .filter((column) => column.id !== primaryId)
                                        .slice(0, 3)
                                        .map((column) => {
                                            const value = renderCell(entity, column.id, row);

                                            return (
                                                <div
                                                    key={column.id}
                                                    className="flex justify-between gap-3"
                                                >
                                                    <dt className="text-muted-foreground">
                                                        {t(columnLabel(resolvedDefs, column.id))}
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
