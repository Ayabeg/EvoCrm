import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export type OutboundDetailProps = {
    totals: Record<string, number>;
    perSequence: Array<{ id: number; name: string; enrollments: number; sent: number; opened: number; replied: number }>;
    perCampaign: Array<{ id: number; name: string; status: string; audience_count: number; sent: number; opened: number; replied: number }>;
    daily: Array<{ day: string; sent: number }>;
    tracking: Record<string, string>;
};

export function OutboundReportsDetail({ totals, perSequence, perCampaign, daily }: OutboundDetailProps) {
    const max = Math.max(...daily.map((d) => d.sent), 1);
    return (
        <section className="mt-10 space-y-4">
            <h2 className="text-sm font-medium">Outbound operations</h2>
            <div className="grid gap-3 md:grid-cols-4">
                {Object.entries(totals).slice(0, 4).map(([k, v]) => (
                    <Card key={k} className="p-3"><p className="text-[11px] uppercase text-muted-foreground">{k}</p><p className="text-lg font-semibold">{v}</p></Card>
                ))}
            </div>
            {daily.length > 0 ? (
                <Card className="flex h-24 items-end gap-1 p-4">
                    {daily.map((d) => <div key={d.day} className="flex-1 rounded-t bg-brand" style={{ height: `${Math.max((d.sent / max) * 100, 3)}%` }} />)}
                </Card>
            ) : null}
            <Card className="overflow-hidden p-0">
                <table className="w-full text-sm"><tbody>
                    {perCampaign.map((c) => (<tr key={c.id} className="border-t border-hairline"><td className="px-4 py-2"><Link href={`/outbound/campaigns/${c.id}`} className="text-brand">{c.name}</Link> <Badge variant="outline">{c.status}</Badge></td><td className="px-4 py-2">{c.sent} sent · {c.replied} replied</td></tr>))}
                    {perSequence.map((s) => (<tr key={s.id} className="border-t border-hairline"><td className="px-4 py-2"><Link href={`/outbound/sequences/${s.id}`} className="text-brand">{s.name}</Link></td><td className="px-4 py-2">{s.enrollments} enrolled · {s.sent} sent</td></tr>))}
                </tbody></table>
            </Card>
        </section>
    );
}
