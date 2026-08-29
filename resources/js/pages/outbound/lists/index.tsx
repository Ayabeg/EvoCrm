import { Link } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';

export default function OutboundListsIndex({ lists }: { lists: Array<{ id: number; name: string; count: number; campaigns: Array<{ id: number; name: string; status: string }> }> }) {
    return (
        <OutboundShell title="Lists">
            <OutboundPage
                title="Audience lists"
                description="Contact segments for outbound campaigns."
                actions={
                    <Link href="/crm/segments" className="text-[13px] text-ink underline-offset-2 hover:underline">
                        Manage segments
                    </Link>
                }
            >
                <section className="overflow-x-auto border-t border-hairline">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-[11px] uppercase text-muted-foreground">
                            <tr><th className="px-4 py-2">List</th><th className="px-4 py-2 text-right">Contacts</th><th className="px-4 py-2">Campaigns</th><th className="px-4 py-2">Open</th></tr>
                        </thead>
                        <tbody>
                            {lists.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-muted-foreground">No contact segments yet.</td></tr>
                            ) : lists.map((list) => (
                                <tr key={list.id} className="border-t border-hairline">
                                    <td className="px-4 py-3 font-medium">{list.name}</td>
                                    <td className="px-4 py-3 text-right">{list.count}</td>
                                    <td className="px-4 py-3">{list.campaigns.map((c) => <Link key={c.id} href={`/outbound/campaigns/${c.id}`} className="me-2 text-ink hover:underline">{c.name}</Link>)}</td>
                                    <td className="px-4 py-3"><Link href={`/crm/contacts?filter_id=${list.id}`} className="text-ink hover:underline">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}
OutboundListsIndex.layout = { breadcrumbs: [{ title: 'Outbound', href: '/outbound' }, { title: 'Lists', href: '/outbound/lists' }] };
