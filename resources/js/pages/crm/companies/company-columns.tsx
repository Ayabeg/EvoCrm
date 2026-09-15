import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import type { ListColumnDef } from '@/lib/list-view-config';

/**
 * Companies column contract for the shared-table path (P05).
 *
 * Visibility + order stay on ListViewConfig / session / saved views.
 * This file only owns Companies cell semantics and copy — no new backend fields.
 *
 * Recommended scan hierarchy (identity → location → owner → metadata).
 * Default visible order from ListViewConfig remains authoritative so saved
 * views do not reorder.
 */
export const COMPANY_COLUMN_IDS = [
    'name',
    'city',
    'wilaya',
    'owner',
    'created_at',
] as const;

export type CompanyListRow = {
    id: number;
    name: string;
    city?: string | null;
    wilaya?: string | null;
    created_at?: string | null;
    owner?: { name: string } | null;
};

export function companyRowHref(row: { id: number | string }): string {
    return `/crm/companies/${row.id}`;
}

export function companyEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: 'No companies match these filters',
            body: 'Clear filters or save a different view to see records.',
        };
    }

    return {
        title: 'No companies yet',
        body: 'Create a company to keep accounts next to their contacts and deals.',
        actionLabel: 'Create company',
    };
}

export function applyCompanyColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'name' ? { ...column, label: 'Company' } : column,
    );
}

export function companyInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

/**
 * Secondary line is compact location. City and wilaya stay their own
 * columns; the identity cell combines them so it can stand alone when
 * scanning. Same-name city/wilaya is shown once.
 */
export function companyIdentitySecondary(row: CompanyListRow): string | null {
    const city = row.city?.trim();
    const wilaya = row.wilaya?.trim();

    if (city && wilaya && city !== wilaya) {
        return `${city} · ${wilaya}`;
    }

    return city || wilaya || null;
}

export function CompanyIdentityCell({
    row,
    href,
    linked = true,
}: {
    row: CompanyListRow;
    href: string;
    linked?: boolean;
}) {
    const name = row.name.trim() || '—';
    const initials = companyInitials(row.name);
    const secondary = companyIdentitySecondary(row);
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
