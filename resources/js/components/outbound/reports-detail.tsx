import { router } from '@inertiajs/react';
import { OutboundReports } from '@/evo/outbound/Reports';
import type { OutboundReportsProps } from '@/evo/outbound/Reports';

export type OutboundDetailProps = OutboundReportsProps;

export function OutboundReportsDetail({
    totals,
    perSequence,
    perCampaign,
    daily,
}: OutboundDetailProps) {
    return (
        <OutboundReports
            totals={totals}
            perSequence={perSequence}
            perCampaign={perCampaign}
            daily={daily}
            onOpenCampaign={(id) => router.visit(`/outbound/campaigns/${id}`)}
            onOpenSequence={(id) => router.visit(`/outbound/sequences/${id}`)}
        />
    );
}
