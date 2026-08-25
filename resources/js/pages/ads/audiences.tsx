import { Form, Link } from '@inertiajs/react';
import { AdsShell } from '@/components/crm/ads-shell';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Audiences"
                    description="CRM contact segments used as ad and outbound audiences. Sync contact segments to Meta Custom Audiences when connected."
                >
                    <div className="flex items-center gap-2">
                        <Badge variant={meta.connected ? 'default' : 'secondary'}>
                            {meta.connected ? 'Meta connected' : 'Meta not connected'}
                        </Badge>
                        <Link href="/crm/segments" className="text-[13px] font-medium text-brand">
                            Manage segments
                        </Link>
                    </div>
                </PageHeader>

                {meta.reason ? (
                    <Card className="border-hairline bg-canvas p-4 text-sm text-muted-foreground">
                        {meta.reason} Meta audience sync requires a connected Meta app and audience ID.
                    </Card>
                ) : null}

                <div className="divide-y divide-hairline rounded-md border border-hairline">
                    {segments.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted-foreground">
                            No contact segments yet. Save a filter from{' '}
                            <Link href="/crm/contacts" className="text-brand">
                                Contacts
                            </Link>{' '}
                            or create one in{' '}
                            <Link href="/crm/segments" className="text-brand">
                                Segments
                            </Link>
                            .
                        </p>
                    ) : (
                        segments.map((segment) => (
                            <div key={segment.id} className="space-y-3 px-4 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <Link
                                            href={`/crm/contacts?filter_id=${segment.id}`}
                                            className="font-medium text-brand"
                                        >
                                            {segment.name}
                                        </Link>
                                        <p className="text-[12px] text-muted-foreground">
                                            Contact segment · used by {segment.campaigns.length} outbound campaign
                                            {segment.campaigns.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/crm/contacts?filter_id=${segment.id}`}
                                        className="text-[12px] font-medium text-brand"
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
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[12px] hover:bg-canvas-soft"
                                                >
                                                    {campaign.name}
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {campaign.status}
                                                    </Badge>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[12px] text-muted-foreground">
                                        No outbound campaigns linked yet.{' '}
                                        <Link href="/outbound/campaigns" className="text-brand">
                                            Create campaign
                                        </Link>
                                    </p>
                                )}

                                {meta.connected ? (
                                    <Form
                                        action={`/crm/segments/${segment.id}/sync-meta`}
                                        method="post"
                                        className="flex flex-wrap items-end gap-2 rounded-md border border-hairline bg-canvas-soft p-3"
                                    >
                                        <div className="min-w-[200px] flex-1">
                                            <Label htmlFor={`audience-${segment.id}`} className="text-[11px]">
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
                                        <Button type="submit" variant="outline" className="h-8 text-[12px]">
                                            Sync to Meta
                                        </Button>
                                    </Form>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
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
