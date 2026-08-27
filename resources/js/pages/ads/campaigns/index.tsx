import { Link } from '@inertiajs/react';
import { EMPTY_FUNNEL } from '@/components/ads/funnel';
import type { FunnelCounts } from '@/components/ads/funnel';
import { AdsShell } from '@/components/crm/ads-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { formatDzd } from '@/lib/money';

export default function AdsCampaignsIndex({
    campaigns,
    funnels,
}: {
    campaigns: Array<{
        id: number;
        name: string;
        status: string;
        account?: { name: string } | null;
    }>;
    funnels: Record<number, FunnelCounts>;
    meta: { connected: boolean };
}) {
    return (
        <AdsShell title="Campaigns">
            <div className="space-y-5 p-6">
                <SurfaceHeader title="Campaigns" description="Meta campaigns synced into this workspace." />
                <HairlinePanel>
                    <HairlineTable>
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Campaign</HairlineTh>
                                <HairlineTh>Account</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                                <HairlineTh align="right">Spend</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <HairlineRow>
                                    <HairlineTd colSpan={4} className="py-6 text-mute">
                                        No campaigns yet.
                                    </HairlineTd>
                                </HairlineRow>
                            ) : (
                                campaigns.map((campaign) => (
                                    <HairlineRow key={campaign.id}>
                                        <HairlineTd>
                                            <Link
                                                href={`/ads/campaigns/${campaign.id}`}
                                                className="font-medium text-brand hover:underline"
                                            >
                                                {campaign.name}
                                            </Link>
                                        </HairlineTd>
                                        <HairlineTd className="text-mute">
                                            {campaign.account?.name ?? '-'}
                                        </HairlineTd>
                                        <HairlineTd>{campaign.status}</HairlineTd>
                                        <HairlineTd align="right" className="money tabular-nums">
                                            {formatDzd((funnels[campaign.id] ?? EMPTY_FUNNEL).spend_cents)}
                                        </HairlineTd>
                                    </HairlineRow>
                                ))
                            )}
                        </tbody>
                    </HairlineTable>
                </HairlinePanel>
            </div>
        </AdsShell>
    );
}
