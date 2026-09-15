import { Link, router } from '@inertiajs/react';
import LeadScorePill from '@/components/crm/lead-score-pill';
import { resolveRowActivation } from '@/ds/workspace/quick-record/row-peek';
import type { RowPeekContext } from '@/ds/workspace/quick-record/row-peek';
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
    applyCompanyColumnContract,
    CompanyIdentityCell as CompanyNameCell,
} from '@/pages/crm/companies/company-columns';
import {
    applyContactColumnContract,
    ContactIdentityCell as ContactNameCell,
} from '@/pages/crm/contacts/contact-columns';
import {
    applyDealColumnContract,
    DealAmountCell,
    DealIdentityCell as DealNameCell,
    DealStageCell,
} from '@/pages/crm/deals/deal-columns';
import type { DealListRow } from '@/pages/crm/deals/deal-columns';
import {
    applyLeadColumnContract,
    LeadIdentityCell as LeadNameCell,
    leadContactName,
    leadScorePayload,
} from '@/pages/crm/leads/lead-columns';
import type { LeadListRow } from '@/pages/crm/leads/lead-columns';
import {
    applyQuoteColumnContract,
    QuoteAmountCell,
    QuoteIdentityCell as QuoteNameCell,
    QuoteStatusCell,
} from '@/pages/crm/quotes/quote-columns';
import type { QuoteListRow } from '@/pages/crm/quotes/quote-columns';

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

type DealRow = DealListRow & {
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

type QuoteRow = QuoteListRow;

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

function contactCommunicationHref(columnId: string, row: ContactRow): string | null {
    if (columnId === 'email' && row.email) {
        return `mailto:${row.email}`;
    }

    if (columnId === 'phone' && row.phone_e164) {
        return `tel:${row.phone_e164}`;
    }

    return null;
}

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

function primaryColumnId(entity: ListObjectType): string {
    if (entity === 'deal' || entity === 'quote' || entity === 'lead') {
        return 'title';
    }

    if (entity === 'ticket') {
        return 'subject';
    }

    return 'name';
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

function renderLeadCell(columnId: string, row: LeadListRow): string {
    switch (columnId) {
        case 'title':
            return row.title.trim() || '—';
        case 'contact':
            return leadContactName(row) ?? '—';
        case 'status':
            return titleCase(row.status);
        case 'score': {
            const score = leadScorePayload(row);

            return score ? String(score.score) : '—';
        }
        default:
            return '—';
    }
}

function renderCell(
    entity: ListObjectType,
    columnId: string,
    row: ContactRow | DealRow | CompanyRow | TicketRow | QuoteRow | LeadListRow,
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

    if (entity === 'lead') {
        return renderLeadCell(columnId, row as LeadListRow);
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
    onRowPeek,
    selectable = false,
    selectedIds = [],
    onToggle,
    onTogglePage,
    isRowSelectable,
}: {
    entity: ListObjectType;
    rows: ContactRow[] | DealRow[] | CompanyRow[] | TicketRow[] | QuoteRow[] | LeadListRow[];
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
                    : columnDefs;
    const identityRow =
        entity === 'contact' ||
        entity === 'company' ||
        entity === 'lead' ||
        entity === 'deal' ||
        entity === 'quote';
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

    const companyTable = entity === 'company';
    const leadTable = entity === 'lead';
    const dealTable = entity === 'deal';
    const quoteTable = entity === 'quote';
    const fixedTable = companyTable || leadTable || dealTable || quoteTable;

    return (
        <div className="@container/list min-h-0 min-w-0 flex-1">
            {/* Desktop / tablet: Aurora-styled table in controlled scroll region */}
            <div
                className={cn(
                    'hidden overflow-x-auto overflow-y-visible @[480px]/list:block',
                    entity === 'contact' ||
                    entity === 'company' ||
                    entity === 'deal' ||
                    entity === 'lead' ||
                    entity === 'quote'
                        ? 'bg-white'
                        : 'bg-canvas',
                )}
            >
                <table
                    className={cn(
                        'w-full border-collapse text-[13px]',
                        dealTable
                            ? 'table-fixed min-w-[68rem]'
                            : quoteTable
                              ? 'table-fixed min-w-[60rem]'
                              : fixedTable
                                ? 'table-fixed min-w-[52rem]'
                                : 'min-w-[640px]',
                    )}
                >
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
                            {visible.map((column, index) => (
                                <th
                                    key={column.id}
                                    className={cn(
                                        'h-12 px-4 text-left font-medium text-mute md:px-8',
                                        identityRow
                                            ? 'text-[13px] leading-[18px]'
                                            : 'text-[11px]',
                                        companyTable && companyColumnWidth(column.id),
                                        leadTable && leadColumnWidth(column.id),
                                        dealTable && dealColumnWidth(column.id),
                                        quoteTable && quoteColumnWidth(column.id),
                                        fixedTable &&
                                            index === visible.length - 1 &&
                                            'pr-6 md:pr-10',
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
                                tabIndex={onRowPeek ? 0 : undefined}
                                aria-label={
                                    onRowPeek
                                        ? `Inspect ${renderCell(entity, primaryId, row)}`
                                        : undefined
                                }
                                data-row-peek={onRowPeek ? 'true' : undefined}
                                className={cn(
                                    identityRow
                                        ? 'min-h-12 cursor-pointer border-b border-hairline transition-colors hover:bg-canvas-soft'
                                        : 'h-12 cursor-pointer border-b border-hairline transition-colors hover:bg-canvas-soft',
                                    selected && 'bg-canvas-soft',
                                    onRowPeek && 'focus-visible:outline-none focus-visible:bg-canvas-soft',
                                )}
                                onClick={(event) => {
                                    activateListRow(
                                        event,
                                        row,
                                        href,
                                        event.currentTarget,
                                        onRowPeek,
                                    );
                                }}
                                onAuxClick={(event) => {
                                    activateListRow(
                                        event,
                                        row,
                                        href,
                                        event.currentTarget,
                                        onRowPeek,
                                    );
                                }}
                                onKeyDown={(event) => {
                                    if (event.key !== 'Enter') {
                                        return;
                                    }

                                    if (event.target !== event.currentTarget) {
                                        return;
                                    }

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
                                    <td className={cn(identityRow ? 'min-h-12 py-2' : 'h-12', 'px-4 md:px-8')}>
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
                                {visible.map((column, index) => {
                                    const label = renderCell(entity, column.id, row);
                                    const isContactName =
                                        entity === 'contact' &&
                                        column.id === 'name';
                                    const isCompanyName =
                                        entity === 'company' &&
                                        column.id === 'name';
                                    const isDealName =
                                        entity === 'deal' &&
                                        column.id === 'title';
                                    const isLeadName =
                                        entity === 'lead' &&
                                        column.id === 'title';
                                    const isLeadScore =
                                        entity === 'lead' &&
                                        column.id === 'score';
                                    const isDealStage =
                                        entity === 'deal' &&
                                        column.id === 'stage';
                                    const isDealAmount =
                                        entity === 'deal' &&
                                        column.id === 'amount';
                                    const isQuoteName =
                                        entity === 'quote' &&
                                        column.id === 'title';
                                    const isQuoteStatus =
                                        entity === 'quote' &&
                                        column.id === 'status';
                                    const isQuoteAmount =
                                        entity === 'quote' &&
                                        column.id === 'amount';
                                    const communicationHref =
                                        entity === 'contact'
                                            ? contactCommunicationHref(
                                                  column.id,
                                                  row as ContactRow,
                                              )
                                            : null;

                                    return (
                                        <td
                                            key={column.id}
                                            className={cn(
                                                identityRow ? 'min-h-12 py-2' : 'h-12',
                                                'px-4 text-left md:px-8',
                                                column.id === primaryId
                                                    ? 'font-medium text-ink'
                                                    : 'text-mute',
                                                column.id === 'amount' &&
                                                    'money tabular-nums text-ink',
                                                fixedTable && 'overflow-hidden',
                                                companyTable && companyColumnWidth(column.id),
                                                leadTable && leadColumnWidth(column.id),
                                                dealTable && dealColumnWidth(column.id),
                                                quoteTable && quoteColumnWidth(column.id),
                                                fixedTable &&
                                                    index === visible.length - 1 &&
                                                    'pr-6 md:pr-10',
                                            )}
                                        >
                                            {isContactName ? (
                                                <ContactNameCell
                                                    row={row as ContactRow}
                                                    href={href}
                                                />
                                            ) : isCompanyName ? (
                                                <CompanyNameCell
                                                    row={row as CompanyRow}
                                                    href={href}
                                                />
                                            ) : isDealName ? (
                                                <DealNameCell
                                                    row={row as DealRow}
                                                    href={href}
                                                />
                                            ) : isDealStage ? (
                                                <DealStageCell
                                                    stage={(row as DealRow).stage}
                                                />
                                            ) : isDealAmount ? (
                                                <DealAmountCell
                                                    cents={(row as DealRow).amount_cents}
                                                />
                                            ) : isLeadName ? (
                                                <LeadNameCell
                                                    row={row as LeadListRow}
                                                    href={href}
                                                />
                                            ) : isLeadScore ? (
                                                <LeadScorePill
                                                    compact
                                                    score={leadScorePayload(row as LeadListRow)}
                                                />
                                            ) : isQuoteName ? (
                                                <QuoteNameCell
                                                    row={row as QuoteRow}
                                                    href={href}
                                                />
                                            ) : isQuoteStatus ? (
                                                <QuoteStatusCell
                                                    status={(row as QuoteRow).status}
                                                    statusLabel={(row as QuoteRow).status_label}
                                                />
                                            ) : isQuoteAmount ? (
                                                <QuoteAmountCell
                                                    cents={(row as QuoteRow).total_cents}
                                                />
                                            ) : communicationHref ? (
                                                <a
                                                    href={communicationHref}
                                                    className="hover:underline"
                                                >
                                                    {label}
                                                </a>
                                            ) : column.id === primaryId ? (
                                                <Link
                                                    href={href}
                                                    className="font-medium text-ink hover:underline"
                                                >
                                                    {label}
                                                </Link>
                                            ) : fixedTable ? (
                                                <span
                                                    className="block truncate"
                                                    title={label !== '—' ? label : undefined}
                                                >
                                                    {label}
                                                </span>
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
                                    <ContactNameCell
                                        row={row as ContactRow}
                                        href={href}
                                    />
                                ) : entity === 'company' ? (
                                    <CompanyNameCell
                                        row={row as CompanyRow}
                                        href={href}
                                    />
                                ) : entity === 'deal' ? (
                                    <DealNameCell
                                        row={row as DealRow}
                                        href={href}
                                    />
                                ) : entity === 'lead' ? (
                                    <LeadNameCell
                                        row={row as LeadListRow}
                                        href={href}
                                    />
                                ) : entity === 'quote' ? (
                                    <QuoteNameCell
                                        row={row as QuoteRow}
                                        href={href}
                                    />
                                ) : (
                                    <Link
                                        href={href}
                                        className="font-medium text-ink hover:underline"
                                    >
                                        {primaryLabel}
                                    </Link>
                                )}
                                <dl className="mt-1 grid gap-1 text-[11px]">
                                    {visible
                                        .filter((column) => column.id !== primaryId)
                                        .slice(0, 3)
                                        .map((column) => {
                                            const value = renderCell(entity, column.id, row);
                                            const communicationHref =
                                                entity === 'contact'
                                                    ? contactCommunicationHref(
                                                          column.id,
                                                          row as ContactRow,
                                                      )
                                                    : null;

                                            return (
                                                <div
                                                    key={column.id}
                                                    className="flex justify-between gap-3"
                                                >
                                                    <dt className="text-muted-foreground">
                                                        {t(columnLabel(resolvedDefs, column.id))}
                                                    </dt>
                                                    <dd className="truncate text-ink">
                                                        {communicationHref ? (
                                                            <a href={communicationHref}>
                                                                {value}
                                                            </a>
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
