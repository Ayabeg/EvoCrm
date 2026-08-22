import { Head, Link, usePage } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Deal = {
    id: number;
    title: string;
    amount_cents: number;
    currency: string;
    contact?: { first_name: string; last_name?: string | null };
    company?: { name: string } | null;
    stage?: { name: string };
};

type Props = {
    stats: {
        open_deals: number;
        inbox_unread: number;
        sequences_enrolled: number;
        ads_leads_today: number;
    };
    nextSteps: Deal[];
    evolution: {
        connected: boolean;
        reason: string | null;
        instance: string;
        mode: string;
    };
    meta_connected: boolean;
    deskUrl: string;
};

export default function Home({ stats, nextSteps, evolution, meta_connected, deskUrl }: Props) {
    const sharedDesk = usePage<{ deskUrl?: string }>().props.deskUrl || deskUrl;

    return (
        <>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <PageHeader
                    title="EvoSales"
                    description="Evotechly sales OS — one workspace, four rooms. Desk is EvoDesk. Official WhatsApp Cloud via Evolution only."
                >
                    <Button asChild>
                        <a href={sharedDesk}>Open Desk</a>
                    </Button>
                </PageHeader>

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        ['Open deals', stats.open_deals, '/crm/deals'],
                        ['Inbox unread (synced)', stats.inbox_unread, '/conversations'],
                        ['Sequences enrolled', stats.sequences_enrolled, '/outbound/sequences'],
                        ['Ads leads today', stats.ads_leads_today, '/ads'],
                    ].map(([label, value, href]) => (
                        <Link key={String(label)} href={String(href)}>
                            <Card className="p-4 transition hover:border-teal-500/40">
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <p className="mt-2 text-3xl font-semibold">{value}</p>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Card className="p-5">
                    <h2 className="font-medium">Today’s next steps</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Open deals with no next activity. Set a date on the deal to clear the row.
                    </p>
                    {nextSteps.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">Nothing waiting — all open deals have a next activity.</p>
                    ) : (
                        <table className="mt-4 w-full text-sm">
                            <thead className="text-left text-muted-foreground">
                                <tr>
                                    <th className="py-2">Deal</th>
                                    <th className="py-2">Contact</th>
                                    <th className="py-2">Stage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nextSteps.map((deal) => (
                                    <tr key={deal.id} className="border-t">
                                        <td className="py-2">
                                            <Link
                                                href={`/crm/deals/${deal.id}`}
                                                className="font-medium text-teal-700 dark:text-teal-300"
                                            >
                                                {deal.title}
                                            </Link>
                                        </td>
                                        <td className="py-2">
                                            {deal.contact?.first_name} {deal.contact?.last_name}
                                        </td>
                                        <td className="py-2">{deal.stage?.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="space-y-3 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Evolution / WhatsApp Cloud</h2>
                            <Badge variant={evolution.connected ? 'default' : 'secondary'}>
                                {evolution.connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Mode {evolution.mode}. Instance {evolution.instance}. Baileys, QR, and Linked-devices are
                            refused.
                        </p>
                        {evolution.reason ? (
                            <p className="text-sm text-amber-700 dark:text-amber-300">{evolution.reason}</p>
                        ) : null}
                        <Link
                            href="/settings/evolution"
                            className="text-sm font-medium text-teal-700 dark:text-teal-300"
                        >
                            Open Evolution settings
                        </Link>
                    </Card>
                    <Card className="space-y-3 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Meta Ads</h2>
                            <Badge variant={meta_connected ? 'default' : 'secondary'}>
                                {meta_connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Credentials are env-driven. Empty tokens stay in a clear not-connected state. Tech Provider
                            / Embedded Signup is later work.
                        </p>
                        <Link href="/ads" className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            Open Ads Center
                        </Link>
                    </Card>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
