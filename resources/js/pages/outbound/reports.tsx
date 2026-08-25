import { Link } from '@inertiajs/react';
import { OutboundShell } from '@/components/crm/outbound-shell';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Totals = {
    queued: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
};

type CampaignRow = {
    id: number;
    name: string;
    status: string;
    audience_count: number;
    suppressed_count: number;
    queued: number;
    deferred: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
};

type SequenceRow = {
    id: number;
    name: string;
    channel: string;
    active: boolean;
    enrollments: number;
    enrollments_active: number;
    enrollments_finished: number;
    sent: number;
    opened: number;
    replied: number;
};

function rate(part: number, whole: number): string {
    if (whole <= 0) {
        return '—';
    }

    return `${Math.round((part / whole) * 100)}%`;
}

export default function OutboundReports({
    totals,
    perSequence,
    perCampaign,
    daily,
    tracking,
}: {
    totals: Totals;
    perSequence: SequenceRow[];
    perCampaign: CampaignRow[];
    daily: { day: string; sent: number }[];
    tracking: Record<
        'sent' | 'opened' | 'clicked' | 'replied' | 'bounced',
        string
    >;
}) {
    const maxSent = Math.max(...daily.map((d) => d.sent), 1);

    return (
        <OutboundShell title="Outbound reports">
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Outbound reports"
                    description="Honest numbers: what EvoSales tracks directly, and what needs an ESP webhook."
                />

                <div className="grid gap-3 md:grid-cols-7">
                    {(
                        [
                            ['Sent', totals.sent, 'sent'],
                            ['Opened', totals.opened, 'opened'],
                            ['Clicked', totals.clicked, 'clicked'],
                            ['Replied', totals.replied, 'replied'],
                            ['Failed', totals.failed, null],
                            ['Bounced', totals.bounced, 'bounced'],
                            ['Queued', totals.queued, null],
                        ] as [string, number, keyof typeof tracking | null][]
                    ).map(([label, value, key]) => (
                        <Card
                            key={label}
                            className="p-3"
                            title={key ? tracking[key] : undefined}
                        >
                            <p className="text-[11px] text-muted-foreground uppercase">
                                {label}
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {value}
                            </p>
                            {key ? (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                    {tracking[key]}
                                </p>
                            ) : null}
                        </Card>
                    ))}
                </div>

                <Card className="space-y-3 p-4">
                    <h2 className="text-sm font-medium">
                        Sent per day · last 30 days
                    </h2>
                    {daily.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No sends yet.
                        </p>
                    ) : (
                        <div className="flex h-24 items-end gap-1">
                            {daily.map((day) => (
                                <div
                                    key={day.day}
                                    title={`${day.day} · ${day.sent} sent`}
                                    className="flex-1 rounded-t-sm bg-brand"
                                    style={{
                                        height: `${Math.max((day.sent / maxSent) * 100, 3)}%`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                        Per campaign
                    </h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Campaign</th>
                                <th className="px-4 py-2">Audience</th>
                                <th className="px-4 py-2">Suppressed</th>
                                <th className="px-4 py-2">Sent</th>
                                <th className="px-4 py-2">Opened</th>
                                <th className="px-4 py-2">Clicked</th>
                                <th className="px-4 py-2">Replied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perCampaign.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={7}
                                    >
                                        No campaigns yet.
                                    </td>
                                </tr>
                            ) : (
                                perCampaign.map((campaign) => (
                                    <tr
                                        key={campaign.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/outbound/campaigns/${campaign.id}`}
                                                className="font-medium text-brand"
                                            >
                                                {campaign.name}
                                            </Link>{' '}
                                            <Badge
                                                variant={
                                                    campaign.status === 'sent'
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {campaign.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.audience_count}
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.suppressed_count}
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.sent}
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.opened}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                {rate(
                                                    campaign.opened,
                                                    campaign.sent,
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.clicked}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                {rate(
                                                    campaign.clicked,
                                                    campaign.sent,
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.replied}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                {rate(
                                                    campaign.replied,
                                                    campaign.sent,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>

                <Card className="overflow-hidden">
                    <h2 className="border-b border-hairline px-4 py-2 text-sm font-medium">
                        Per sequence
                    </h2>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Sequence</th>
                                <th className="px-4 py-2">Enrolled</th>
                                <th className="px-4 py-2">Active</th>
                                <th className="px-4 py-2">Finished</th>
                                <th className="px-4 py-2">Sent</th>
                                <th className="px-4 py-2">Opened</th>
                                <th className="px-4 py-2">Replied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perSequence.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={7}
                                    >
                                        No sequences yet.
                                    </td>
                                </tr>
                            ) : (
                                perSequence.map((sequence) => (
                                    <tr
                                        key={sequence.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/outbound/sequences/${sequence.id}`}
                                                className="font-medium text-brand"
                                            >
                                                {sequence.name}
                                            </Link>{' '}
                                            <Badge
                                                variant={
                                                    sequence.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {sequence.active
                                                    ? 'active'
                                                    : 'draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.enrollments}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.enrollments_active}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.enrollments_finished}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.sent}
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.opened}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                {rate(
                                                    sequence.opened,
                                                    sequence.sent,
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {sequence.replied}{' '}
                                            <span className="text-xs text-muted-foreground">
                                                {rate(
                                                    sequence.replied,
                                                    sequence.sent,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </OutboundShell>
    );
}

OutboundReports.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/outbound/reports' }],
};
