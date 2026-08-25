import { Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import { formatDzd } from '@/lib/money';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function AdsAdSetsIndex({ adSets }: { adSets: Array<{ id: number; name: string; status: string; daily_budget_cents: number; ads_count: number; campaign?: { id: number; name: string } | null }>; meta: { connected: boolean } }) {
    return (<AdsShell title="Ad sets"><div className="p-6"><PageHeader title="Ad sets" description="Synced ad sets." /><Card className="overflow-hidden"><table className="w-full text-sm"><tbody>{adSets.map((a) => (<tr key={a.id} className="border-t border-hairline"><td className="px-4 py-3">{a.name}</td><td className="px-4 py-3">{a.campaign ? <Link href={`/ads/campaigns/${a.campaign.id}`} className="text-brand">{a.campaign.name}</Link> : '—'}</td><td className="px-4 py-3">{a.status}</td><td className="px-4 py-3 text-right">{a.daily_budget_cents ? formatDzd(a.daily_budget_cents) : '—'}</td><td className="px-4 py-3 text-right">{a.ads_count}</td></tr>))}</tbody></table></Card></div></AdsShell>);
}
