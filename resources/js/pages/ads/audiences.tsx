import { Form, Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LinkedCampaign = {
    id: number;
    name: string;
    status: string;
};

type Segment = {
    id: number;
    name: string;
    entity: string;
    campaigns: LinkedCampaign[];
};

type Props = {
    segments: Segment[];
    meta: { connected: boolean; reason: string | null };
};

export default function AdsAudiences({ segments, meta }: Props) {
    return (
        <AdsShell title="Audiences">
            <div className="flex-1 space-y-5 p-6">
                <SurfaceHeader
                    title="Audiences"
                    description="CRM contact segments used as ad and outbound audiences. Sync contact segments to Meta Custom Audiences when connected."
                >
                    <Badge variant={meta.connected ? 'default' : 'secondary'}>
                        {meta.connected ? 'Meta connected' : 'Meta not connected'}
                    </Badge>
                    <Link href="/crm/segments" className="aurora-text-body-sm font-medium text-brand hover:underline">
                        Manage segments
                    </Link>
                </SurfaceHeader>

                {meta.reason ? (
                    <HairlinePanel className="px-4 py-3">
                        <p className="aurora-text-body-sm text-mute">
                            {meta.reason} Meta audience sync requires a connected Meta app and audience ID.
                        </p>
                    </HairlinePanel>
                ) : null}

                <HairlinePanel>
                    {segments.length === 0 ? (
                        <p className="aurora-text-body-sm px-4 py-6 text-mute">
                            No contact segments yet. Save a filter from{' '}
                            <Link href="/crm/contacts" className="font-medium text-brand hover:underline">
                                Contacts
                            </Link>{' '}
                            or create one in{' '}
                            <Link href="/crm/segments" className="font-medium text-brand hover:underline">
                                Segments
                            </Link>
                            .
                        </p>
                    ) : (
                        <ul className="divide-y divide-hairline">
                            {segments.map((segment) => (
                                <li key={segment.id} className="space-y-3 px-4 py-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <Link
                                                href={`/crm/contacts?filter_id=${segment.id}`}
                                                className="aurora-text-body-sm font-medium text-brand hover:underline"
                                            >
                                                {segment.name}
                                            </Link>
                                            <p className="aurora-text-caption text-mute">
                                                Contact segment · used by {segment.campaigns.length} outbound
                                                campaign
                                                {segment.campaigns.length === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/crm/contacts?filter_id=${segment.id}`}
                                            className="aurora-text-caption font-medium text-brand hover:underline"
                                        >
                                            View members
                                        </Link>
                                    </div>

                                    {segment.campaigns.length > 0 ? (
                                        <ul className="flex flex-wrap gap-2">
                                            {segment.campaigns.map((campaign) => (
                                                <li key={campaign.id}>
                                                    <Link
                                                        href={`/outbound/campaigns/${campaign.id}`}
                                                        className="aurora-text-caption inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 hover:bg-canvas-soft"
                                                    >
                                                        {campaign.name}
                                                        <Badge variant="outline">{campaign.status}</Badge>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="aurora-text-caption text-mute">
                                            No outbound campaigns linked yet.{' '}
                                            <Link
                                                href="/outbound/campaigns"
                                                className="font-medium text-brand hover:underline"
                                            >
                                                Create campaign
                                            </Link>
                                        </p>
                                    )}

                                    {meta.connected ? (
                                        <Form
                                            action={`/crm/segments/${segment.id}/sync-meta`}
                                            method="post"
                                            className="flex flex-wrap items-end gap-2 rounded-lg border border-hairline bg-canvas-soft p-3"
                                        >
                                            <div className="min-w-[200px] flex-1">
                                                <Label
                                                    htmlFor={`audience-${segment.id}`}
                                                    className="aurora-text-caption"
                                                >
                                                    Meta Custom Audience ID
                                                </Label>
                                                <Input
                                                    id={`audience-${segment.id}`}
                                                    name="audience_id"
                                                    placeholder="1234567890"
                                                    className="mt-1 h-8 bg-canvas"
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" size="sm">
                                                Sync to Meta
                                            </Button>
                                        </Form>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </HairlinePanel>
            </div>
        </AdsShell>
    );
}

AdsAudiences.layout = {
    breadcrumbs: [
        { title: 'Ads', href: '/ads' },
        { title: 'Audiences', href: '/ads/audiences' },
    ],
};
