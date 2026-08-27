import { Link } from '@inertiajs/react';
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

export default function AdsAdSetsIndex({
    adSets,
}: {
    adSets: Array<{
        id: number;
        name: string;
        status: string;
        daily_budget_cents: number;
        ads_count: number;
        campaign?: { id: number; name: string } | null;
    }>;
    meta: { connected: boolean };
}) {
    return (
        <AdsShell title="Ad sets">
            <div className="space-y-5 p-6">
                <SurfaceHeader title="Ad sets" description="Synced ad sets." />
                <HairlinePanel>
                    <HairlineTable>
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Ad set</HairlineTh>
                                <HairlineTh>Campaign</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                                <HairlineTh align="right">Budget/day</HairlineTh>
                                <HairlineTh align="right">Ads</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {adSets.length === 0 ? (
                                <HairlineRow>
                                    <HairlineTd colSpan={5} className="py-6 text-mute">
                                        No ad sets yet.
                                    </HairlineTd>
                                </HairlineRow>
                            ) : (
                                adSets.map((set) => (
                                    <HairlineRow key={set.id}>
                                        <HairlineTd className="font-medium">{set.name}</HairlineTd>
                                        <HairlineTd>
                                            {set.campaign ? (
                                                <Link
                                                    href={`/ads/campaigns/${set.campaign.id}`}
                                                    className="text-brand hover:underline"
                                                >
                                                    {set.campaign.name}
                                                </Link>
                                            ) : (
                                                '-'
                                            )}
                                        </HairlineTd>
                                        <HairlineTd>{set.status}</HairlineTd>
                                        <HairlineTd align="right" className="money tabular-nums">
                                            {set.daily_budget_cents ? formatDzd(set.daily_budget_cents) : '-'}
                                        </HairlineTd>
                                        <HairlineTd align="right" className="tabular-nums">
                                            {set.ads_count}
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
