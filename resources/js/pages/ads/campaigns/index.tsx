import { Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import { EMPTY_FUNNEL } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { formatDzd } from '@/lib/money';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function AdsCampaignsIndex({ campaigns, funnels }: { campaigns: Array<{ id: number; name: string; status: string; account?: { name: string } | null }>; funnels: Record<number, FunnelCounts>; meta: { connected: boolean } }) {
    return (<AdsShell title="Campaigns"><div className="p-6 space-y-4"><PageHeader title="Campaigns" description="Meta campaigns." /><Card className="overflow-hidden"><table className="w-full text-sm"><tbody>{campaigns.map((c) => (<tr key={c.id} className="border-t border-hairline"><td className="px-4 py-3"><Link href={`/ads/campaigns/${c.id}`} className="text-brand">{c.name}</Link></td><td className="px-4 py-3">{c.account?.name ?? '—'}</td><td className="px-4 py-3">{c.status}</td><td className="px-4 py-3 text-right">{formatDzd((funnels[c.id] ?? EMPTY_FUNNEL).spend_cents)}</td></tr>))}</tbody></table></Card></div></AdsShell>);
}
