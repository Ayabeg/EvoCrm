import { Link } from '@inertiajs/react';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import { contactInitials, formatContactName } from '@/lib/contact-name';
import { t } from '@/lib/i18n';
import type { ListColumnDef } from '@/lib/list-view-config';

/**
 * Contacts column contract for the shared-table path (P04).
 *
 * Visibility + order stay on ListViewConfig / session / saved views.
 * This file only owns Contacts cell semantics and copy — no new backend fields.
 *
 * Recommended scan hierarchy (identity → association → communication →
 * owner → lifecycle → activity → metadata). Default visible order from
 * ListViewConfig remains authoritative so saved views do not reorder.
 */
export const CONTACT_COLUMN_IDS = [
    'name',
    'email',
    'phone',
    'lead_status',
    'company',
    'owner',
    'city',
    'wilaya',
    'last_activity_at',
    'created_at',
] as const;

export type ContactListRow = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    city?: string | null;
    wilaya?: string | null;
    lead_status?: string | null;
    created_at?: string | null;
    last_activity_at?: string | null;
    company?: { name: string } | null;
    owner?: { name: string } | null;
};

export function contactRowHref(row: { id: number | string }): string {
    return `/crm/contacts/${row.id}`;
}

export function contactEmptyState(filtered: boolean): DataWorkspaceEmpty {
    if (filtered) {
        return {
            title: t('No contacts match these filters'),
            body: t('Clear filters or open another saved view to see records.'),
        };
    }

    return {
        title: t('No contacts yet'),
        body: t('Add the first person you sell to, or import a list. Name, phone, and company are enough to start.'),
        actionLabel: t('Create contact'),
    };
}

export function applyContactColumnContract(columnDefs: ListColumnDef[]): ListColumnDef[] {
    return columnDefs.map((column) =>
        column.id === 'name' ? { ...column, label: 'Contact' } : column,
    );
}

/**
 * Secondary line is association only. Email stays in the Email column so
 * the identity cell never duplicates a typically-visible communication field.
 */
export function contactIdentitySecondary(row: ContactListRow): string | null {
    const company = row.company?.name?.trim();

    return company || null;
}

export function ContactIdentityCell({
    row,
    href,
    linked = true,
}: {
    row: ContactListRow;
    href: string;
    linked?: boolean;
}) {
    const name = formatContactName(row.first_name, row.last_name);
    const initials = contactInitials(row.first_name, row.last_name);
    const secondary = contactIdentitySecondary(row);
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
            <span className="inline-flex h-9 min-w-0 items-center gap-2">{body}</span>
        );
    }

    return (
        <Link
            href={href}
            className="inline-flex h-9 min-w-0 items-center gap-2 hover:underline"
        >
            {body}
        </Link>
    );
}
