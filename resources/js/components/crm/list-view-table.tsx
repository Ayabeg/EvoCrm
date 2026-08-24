import { Link } from '@inertiajs/react';
import type { ListColumnDef, ListViewColumn } from '@/lib/list-view-config';
import { columnLabel, visibleColumns } from '@/lib/list-view-config';
import { formatDzd } from '@/components/crm/hub-chrome';

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
        case 'owner':
            return row.owner?.name ?? '—';
        case 'close_date':
            return formatDate(row.close_date);
        case 'company':
            return row.company?.name ?? '—';
        case 'contact':
            return row.contact ? `${row.contact.first_name} ${row.contact.last_name ?? ''}`.trim() : '—';
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
    const visible = visibleColumns({ columnDefs, filterFields: [], columns, sort: { field: 'created_at', direction: 'desc' } });

    return (
        <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
                <tr>
                    {visible.map((column) => (
                        <th key={column.id} className="px-4 py-2">
                            {columnLabel(columnDefs, column.id)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id} className="border-t">
                        {visible.map((column) => {
                            const label =
                                entity === 'contact'
                                    ? renderContactCell(column.id, row as ContactRow)
                                    : entity === 'deal'
                                      ? renderDealCell(column.id, row as DealRow)
                                      : renderCompanyCell(column.id, row as CompanyRow);

                            return (
                                <td key={column.id} className="px-4 py-2">
                                    {column.id === 'name' || column.id === 'title' ? (
                                        <Link href={`${basePath}/${row.id}`} className="font-medium text-brand">
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
    );
}
