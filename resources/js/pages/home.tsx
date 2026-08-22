import { Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type Props = {
    stats: {
        contacts: number;
        leads: number;
        deals: number;
        open_threads: number;
    };
    evolution: {
        connected: boolean;
        reason: string | null;
        instance: string;
        mode: string;
    };
    meta_connected: boolean;
};

export default function Home({ stats, evolution, meta_connected }: Props) {
    return (
        <>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <PageHeader
                    title="EvoSales"
                    description="Evotechly sales OS — one workspace, four rooms. Official WhatsApp Cloud via Evolution only."
                />

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        ['Contacts', stats.contacts, '/crm/contacts'],
                        ['Leads', stats.leads, '/crm/leads'],
                        ['Deals', stats.deals, '/crm/deals'],
                        ['Open desk', stats.open_threads, '/desk'],
                    ].map(([label, value, href]) => (
                        <Link key={label} href={String(href)}>
                            <Card className="p-4 transition hover:border-teal-500/40">
                                <p className="text-sm text-muted-foreground">
                                    {label}
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                    {value}
                                </p>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="space-y-3 p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Evolution / WhatsApp Cloud</h2>
                            <Badge variant={evolution.connected ? 'default' : 'secondary'}>
                                {evolution.connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Mode {evolution.mode}. Instance {evolution.instance}.
                            Baileys, QR, and Linked-devices are refused.
                        </p>
                        {evolution.reason ? (
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                {evolution.reason}
                            </p>
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
                            Credentials are env-driven. Empty tokens stay in a
                            clear not-connected state. Tech Provider / Embedded
                            Signup is later work.
                        </p>
                        <Link
                            href="/ads"
                            className="text-sm font-medium text-teal-700 dark:text-teal-300"
                        >
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
