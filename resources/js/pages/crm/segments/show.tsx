import { Head, Link } from '@inertiajs/react';
import { CrmShell } from '@/components/crm/crm-shell';
import PageHeader from '@/components/page-header';

type HistoryRow = {
    id: number;
    contact_id: number;
    contact_name: string;
    entered_at: string | null;
    exited_at: string | null;
    status: 'current' | 'exited';
};

export default function SegmentShow({
    segment,
    history,
}: {
    segment: { id: number; name: string; entity: string };
    history: HistoryRow[];
}) {
    const listHref = segment.entity === 'deal'
        ? `/crm/deals?filter_id=${segment.id}`
        : `/crm/contacts?filter_id=${segment.id}`;

    return (
        <CrmShell title={segment.name}>
            <Head title={segment.name} />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title={segment.name}
                    description="Membership history for this segment. Current members stay on the filtered list."
                >
                    <Link href="/crm/segments" className="text-[13px] text-muted-foreground hover:text-ink">
                        All segments
                    </Link>
                    <Link href={listHref} className="text-[13px] font-medium text-brand">
                        Current members
                    </Link>
                </PageHeader>
                <section aria-label="Membership history" className="overflow-hidden rounded-lg border border-hairline bg-canvas">
                    <table className="w-full text-sm">
                        <thead className="bg-canvas-soft text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2">Contact</th>
                                <th className="px-4 py-2">Entered</th>
                                <th className="px-4 py-2">Exited</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                                        No enter or exit history yet.
                                    </td>
                                </tr>
                            ) : (
                                history.map((row) => (
                                    <tr key={row.id} className="border-t border-hairline">
                                        <td className="px-4 py-3">
                                            <Link href={`/crm/contacts/${row.contact_id}`} className="text-brand">
                                                {row.contact_name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.entered_at ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.exited_at ?? '—'}</td>
                                        <td className="px-4 py-3 capitalize">{row.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </CrmShell>
    );
}

SegmentShow.layout = {
    breadcrumbs: [
        { title: 'Segments', href: '/crm/segments' },
        { title: 'History', href: '' },
    ],
};
