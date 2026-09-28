import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import { formatContactName } from '@/lib/contact-name';
import type { ListColumnDef } from '@/lib/list-view-config';

/**
 * Leads column contract for the shared-table path (P06).
 *
 * Visibility + order stay on ListViewConfig / session.
 * This file only owns Leads cell semantics and copy — no new backend fields.
 * Source, owner, company, created_at, last activity, and conversion target
 * exist on the model or related records but are not list columns today.
 *
 * Recommended scan hierarchy (identity → contact → qualification → score).
 * Default visible order from ListViewConfig remains the current list:
 * title, contact, status, score.
 */
export const LEAD_COLUMN_IDS = [
    'title',
    'contact',
    'status',
    'score',
] as const;

export type LeadListRow = {
    id: number;
    title: string;
    status?: string | null;
    score?: number | null;
    contact?: { first_name?: string; last_name?: string | null } | null;
    latest_score?: { score: number; reason?: string | null } | null;
};

export function leadRowHref(row: { id: number | string }): string {
    return `/crm/leads/${row.id}`;
}

export function leadEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: 'No leads match these filters',
            body: 'Clear filters to see inbound records again.',
        };
    }

    return {
        title: 'No leads yet',
        body: 'Create a lead from an existing contact to work inbound records here.',
        actionLabel: 'Create lead',
    };
}

export function applyLeadColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'title' ? { ...column, label: 'Lead' } : column,
    );
}

export function leadInitials(title: string): string {
    return title
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function leadContactName(row: LeadListRow): string | null {
    const first = row.contact?.first_name?.trim();
    const last = row.contact?.last_name;

    if (!first) {
        return null;
    }

    return formatContactName(first, last) || null;
}

/**
 * Secondary line is the linked contact. Status and score stay in their
 * own columns so the identity cell never duplicates qualification.
 */
export function leadIdentitySecondary(row: LeadListRow): string | null {
    return leadContactName(row);
}

export function LeadIdentityCell({
    row,
    href,
    linked = true,
}: {
    row: LeadListRow;
    href: string;
    linked?: boolean;
}) {
    const name = row.title.trim() || '—';
    const initials = leadInitials(row.title);
    const secondary = leadIdentitySecondary(row);
    const body = (
        <>
            <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] leading-none font-medium text-white"
                aria-hidden
            >
                {initials || '?'}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[13px] leading-[18px] font-medium text-ink" title={name}>
                    {name}
                </span>
                {secondary ? <span className="sr-only">{secondary}</span> : null}
            </span>
        </>
    );

    if (!linked) {
        return (
            <span className="flex h-9 w-full min-w-0 items-center gap-2">{body}</span>
        );
    }

    return (
        <Link
            href={href}
            className="flex h-9 w-full min-w-0 items-center gap-2 hover:underline"
        >
            {body}
        </Link>
    );
}

function finiteLeadScore(value: number | null | undefined): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Prefer latest_score (value + reason) when present. Contabo can store a
 * denormalized leads.score with no lead_scores rows — 0 is a real score.
 * Hide only when both latest_score and score are absent.
 */
export function leadScorePayload(row: LeadListRow): {
    score: number;
    reason?: string | null;
} | null {
    if (row.latest_score) {
        return {
            score: finiteLeadScore(row.score) ?? row.latest_score.score,
            reason: row.latest_score.reason,
        };
    }

    const denormalized = finiteLeadScore(row.score);

    if (denormalized === null) {
        return null;
    }

    return { score: denormalized };
}
