import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import type { ListColumnDef } from '@/lib/list-view-config';
import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Quotes column contract for the shared-table path (P08).
 *
 * Visibility + order stay on ListViewConfig / session.
 * This file only owns Quotes cell semantics and copy — no new backend fields.
 * Customer lives on the Deal, not the Quote. Do not invent a universal
 * Customer column. Delivery (send / preview / revoke) stays on show (P18).
 *
 * Recommended scan hierarchy (identity → status → amount → owner → dates).
 * Default visible order from ListViewConfig remains authoritative:
 * title, amount, status, owner, created_at, expires_at (sent_at hidden).
 */
export const QUOTE_COLUMN_IDS = [
    'title',
    'amount',
    'status',
    'owner',
    'created_at',
    'expires_at',
    'sent_at',
] as const;

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted'] as const;

export type QuoteListRow = {
    id: number;
    title: string;
    status: string;
    status_label?: string;
    total_cents?: number | null;
    created_at?: string | null;
    expires_at?: string | null;
    sent_at?: string | null;
    owner?: { id?: number; name: string } | null;
    deal?: { id: number; title: string } | null;
};

export function quoteRowHref(row: { id: number | string }): string {
    return `/crm/quotes/${row.id}`;
}

export function quoteEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: 'No quotes match these filters',
            body: 'Clear filters or pick another owner to see records.',
        };
    }

    return {
        title: 'No quotes yet',
        body: 'Create a quote on a deal. Amount, status, and owner stay on this list.',
        actionLabel: 'Create quote',
    };
}

export function applyQuoteColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'title' ? { ...column, label: 'Quote' } : column,
    );
}

export function quoteInitials(title: string): string {
    return title
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function quoteNumberLabel(id: number | string): string {
    return `Quote #${id}`;
}

/**
 * Primary identity is the stored title (deal title, or Quote #{id} when
 * the deal is missing). Secondary is the quote number only when it is
 * not already the primary — never duplicate deal title under itself.
 */
export function quoteIdentityPrimary(row: QuoteListRow): string {
    const title = row.title.trim();

    return title || quoteNumberLabel(row.id);
}

export function quoteIdentitySecondary(row: QuoteListRow): string | null {
    const number = quoteNumberLabel(row.id);
    const primary = quoteIdentityPrimary(row);

    if (primary === number) {
        return null;
    }

    return number;
}

export function QuoteIdentityCell({
    row,
    href,
    linked = true,
}: {
    row: QuoteListRow;
    href: string;
    linked?: boolean;
}) {
    const name = quoteIdentityPrimary(row);
    const initials = quoteInitials(name);
    const secondary = quoteIdentitySecondary(row);
    const body = (
        <>
            <span
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eceae6] text-[10px] leading-none font-medium text-ink"
                aria-hidden
            >
                {initials || '?'}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[13px] leading-[18px] font-medium text-ink" title={name}>
                    {name}
                </span>
                {secondary ? (
                    <span className="block truncate text-[12px] leading-4 text-mute" title={secondary}>
                        {secondary}
                    </span>
                ) : null}
            </span>
        </>
    );

    if (!linked) {
        return (
            <span className="flex w-full min-w-0 items-start gap-2">{body}</span>
        );
    }

    return (
        <Link
            href={href}
            className="flex w-full min-w-0 items-start gap-2 hover:underline"
        >
            {body}
        </Link>
    );
}

/** Existing formatDzd only. No conversion, no extra rounding, no recompute. */
export function quoteAmountLabel(cents?: number | null): string {
    return formatDzd(cents ?? 0);
}

export function QuoteAmountCell({ cents }: { cents?: number | null }) {
    const label = quoteAmountLabel(cents);

    return (
        <span
            className="money block min-w-0 max-w-full text-right break-words tabular-nums text-[13px] leading-[18px] text-ink"
            title={label}
        >
            {label}
        </span>
    );
}

/**
 * Restrained list status tone. Exact production statuses only.
 * Do not infer expired from expires_at — backend owns state
 * (draft / sent / accepted). Not all orange. No filled badges.
 */
export function quoteStatusTone(
    status?: string | null,
): 'draft' | 'sent' | 'accepted' | 'unknown' {
    if (status === 'accepted') {
        return 'accepted';
    }

    if (status === 'sent') {
        return 'sent';
    }

    if (status === 'draft') {
        return 'draft';
    }

    return 'unknown';
}

export function quoteStatusLabel(row: Pick<QuoteListRow, 'status' | 'status_label'>): string {
    const labeled = row.status_label?.trim();

    if (labeled) {
        return labeled;
    }

    if (!row.status) {
        return '—';
    }

    return row.status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function QuoteStatusCell({
    status,
    statusLabel,
}: {
    status?: string | null;
    statusLabel?: string | null;
}) {
    const label = quoteStatusLabel({
        status: status ?? '',
        status_label: statusLabel ?? undefined,
    });
    const tone = quoteStatusTone(status);

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 truncate text-[13px] leading-[18px]',
                tone === 'accepted' && 'font-medium text-ink',
                tone === 'sent' && 'text-ink',
                (tone === 'draft' || tone === 'unknown') && 'text-mute',
            )}
            title={label !== '—' ? label : undefined}
            data-status-tone={tone}
        >
            {tone === 'accepted' || tone === 'sent' ? (
                <i
                    aria-hidden
                    className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        tone === 'accepted' ? 'bg-[#17a85b]' : 'bg-[#5c5a55]',
                    )}
                />
            ) : null}
            <span className="truncate">{label}</span>
        </span>
    );
}
