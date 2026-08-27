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

export default function AdsListIndex({
    ads,
}: {
    ads: Array<{
        id: number;
        name: string;
        status: string;
        kind: string;
        ad_set?: { name: string; campaign?: { id: number; name: string } | null } | null;
    }>;
    meta: { connected: boolean };
}) {
    return (
        <AdsShell title="Ads">
            <div className="space-y-5 p-6">
                <SurfaceHeader title="Ads" description="Synced ads." />
                <HairlinePanel>
                    <HairlineTable>
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Ad</HairlineTh>
                                <HairlineTh>Kind</HairlineTh>
                                <HairlineTh>Ad set</HairlineTh>
                                <HairlineTh>Campaign</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {ads.length === 0 ? (
                                <HairlineRow>
                                    <HairlineTd colSpan={5} className="py-6 text-mute">
                                        No ads yet.
                                    </HairlineTd>
                                </HairlineRow>
                            ) : (
                                ads.map((ad) => (
                                    <HairlineRow key={ad.id}>
                                        <HairlineTd className="font-medium">{ad.name}</HairlineTd>
                                        <HairlineTd>{ad.kind}</HairlineTd>
                                        <HairlineTd className="text-mute">{ad.ad_set?.name ?? '-'}</HairlineTd>
                                        <HairlineTd>
                                            {ad.ad_set?.campaign ? (
                                                <Link
                                                    href={`/ads/campaigns/${ad.ad_set.campaign.id}`}
                                                    className="text-brand hover:underline"
                                                >
                                                    {ad.ad_set.campaign.name}
                                                </Link>
                                            ) : (
                                                '-'
                                            )}
                                        </HairlineTd>
                                        <HairlineTd>{ad.status}</HairlineTd>
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
