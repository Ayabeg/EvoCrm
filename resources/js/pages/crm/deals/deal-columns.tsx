import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import { formatContactName } from '@/lib/contact-name';
import type { DealAttention } from '@/lib/deal-attention';
import { attentionToneClass } from '@/lib/deal-attention';
import type { ListColumnDef } from '@/lib/list-view-config';
import { formatDzd } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Deals column contract for the shared-table path (P07).
 *
 * Visibility + order stay on ListViewConfig / session / saved views.
 * This file only owns Deals cell semantics and copy — no new backend fields.
 * Board movement and P12 next-step scoring stay out of this list.
 *
 * Recommended scan hierarchy (identity → stage → amount → close → owner
 * → association → activity → metadata). Default visible order from
 * ListViewConfig remains authoritative so saved views do not reorder.
 */
export const DEAL_COLUMN_IDS = [
    'title',
    'stage',
    'amount',
    'close_date',
    'owner',
    'company',
    'contact',
    'attention',
    'health',
    'next_step',
    'last_activity_at',
    'created_at',
] as const;

export type DealListRow = {
    id: number;
    title: string;
    amount_cents?: number | null;
    close_date?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    owner?: { id?: number; name: string } | null;
    company?: { name: string } | null;
    contact?: { first_name: string; last_name?: string | null } | null;
    stage?: {
        id?: number;
        name: string;
        slug: string;
        is_won?: boolean;
        is_lost?: boolean;
    } | null;
    health?: { score: number; band?: string; label?: string } | null;
    next_step?: string | null;
    attention?: DealAttention | null;
};

export function dealRowHref(row: { id: number | string }): string {
    return `/crm/deals/${row.id}`;
}

export function dealEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: 'No deals match these filters',
            body: 'Clear filters or pick another stage to see records.',
        };
    }

    return {
        title: 'No deals yet',
        body: 'Create a deal to start working your pipeline from this list.',
        actionLabel: 'Create deal',
    };
}

export function applyDealColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'title' ? { ...column, label: 'Deal' } : column,
    );
}

export function dealInitials(title: string): string {
    return title
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function dealContactName(row: DealListRow): string | null {
    if (!row.contact) {
        return null;
    }

    const name = formatContactName(row.contact.first_name, row.contact.last_name).trim();

    return name || null;
}

/**
 * Secondary line is one association only. Prefer company (the account).
 * Fall back to contact. Do not stack both — company and contact stay
 * their own columns and must not be duplicated under the title.
 */
export function dealIdentitySecondary(row: DealListRow): string | null {
    const company = row.company?.name?.trim();

    if (company) {
        return company;
    }

    return dealContactName(row);
}

export function DealIdentityCell({
    row,
    href,
    linked = true,
}: {
    row: DealListRow;
    href: string;
    linked?: boolean;
}) {
    const name = row.title.trim() || '—';
    const initials = dealInitials(row.title);
    const secondary = dealIdentitySecondary(row);
    const body = (
        <>
            <span
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] leading-none font-medium text-white"
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

/** Existing formatDzd only. No conversion, no extra rounding. */
export function dealAmountLabel(cents?: number | null): string {
    return formatDzd(cents ?? 0);
}

export function DealAmountCell({ cents }: { cents?: number | null }) {
    const label = dealAmountLabel(cents);

    return (
        <span
            className="money block truncate tabular-nums text-[13px] leading-[18px] text-ink"
            title={label}
        >
            {label}
        </span>
    );
}

/**
 * Restrained list stage tone. Won is quiet success (ink, not green splash).
 * Lost is quiet danger. Open stages stay mute — not all orange.
 * Prefer is_won / is_lost; fall back to the real default slugs.
 */
export function dealStageTone(
    stage?: DealListRow['stage'] | null,
): 'won' | 'lost' | 'open' {
    if (!stage) {
        return 'open';
    }

    if (stage.is_won || stage.slug === 'won') {
        return 'won';
    }

    if (stage.is_lost || stage.slug === 'lost') {
        return 'lost';
    }

    return 'open';
}

export function DealAttentionCell({
    attention,
}: {
    attention?: DealAttention | null;
}) {
    const primary = attention?.primary;

    if (!primary) {
        return (
            <span className="block truncate text-[13px] leading-[18px] text-mute" data-attention="">
                —
            </span>
        );
    }

    return (
        <span
            className={cn(
                'block truncate text-[13px] leading-[18px]',
                attentionToneClass(primary.severity),
            )}
            title={primary.reason ?? primary.label}
            data-attention={primary.type}
            data-attention-severity={primary.severity}
        >
            {primary.label}
        </span>
    );
}

export function DealStageCell({
    stage,
}: {
    stage?: DealListRow['stage'] | null;
}) {
    const name = stage?.name?.trim() || '—';
    const tone = dealStageTone(stage);

    return (
        <span
            className={cn(
                'block truncate text-[13px] leading-[18px]',
                tone === 'won' && 'font-medium text-ink',
                tone === 'lost' && 'text-destructive',
                tone === 'open' && 'text-mute',
            )}
            title={name !== '—' ? name : undefined}
            data-stage-tone={tone}
        >
            {name}
        </span>
    );
}
