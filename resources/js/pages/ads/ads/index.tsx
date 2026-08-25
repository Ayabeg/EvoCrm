import { Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';

export default function AdsListIndex({ ads }: { ads: Array<{ id: number; name: string; status: string; kind: string; ad_set?: { name: string; campaign?: { id: number; name: string } | null } | null }>; meta: { connected: boolean } }) {
    return (<AdsShell title="Ads"><div className="p-6"><PageHeader title="Ads" description="Synced ads." /><Card className="overflow-hidden"><table className="w-full text-sm"><tbody>{ads.map((ad) => (<tr key={ad.id} className="border-t border-hairline"><td className="px-4 py-3">{ad.name}</td><td className="px-4 py-3">{ad.kind}</td><td className="px-4 py-3">{ad.ad_set?.name ?? '—'}</td><td className="px-4 py-3">{ad.ad_set?.campaign ? <Link href={`/ads/campaigns/${ad.ad_set.campaign.id}`} className="text-brand">{ad.ad_set.campaign.name}</Link> : '—'}</td><td className="px-4 py-3">{ad.status}</td></tr>))}</tbody></table></Card></div></AdsShell>);
}
