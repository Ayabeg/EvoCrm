import { Head, Link, usePage } from '@inertiajs/react';
import { formatDzd } from '@/components/crm/hub-chrome';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Task = {
    id: number;
    subject?: string | null;
    body?: string | null;
    due_at?: string | null;
    contact?: { id: number; first_name: string; last_name?: string | null };
    deal?: { id: number; title: string; stage?: { name: string } };
    owner?: { name: string };
};

type Props = {
    stats: {
        open_deals: number;
        open_pipeline_cents: number;
        inbox_unread: number;
        sequences_enrolled: number;
        ads_leads_today: number;
        open_tasks: number;
    };
    nextSteps: Task[];
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
            <div className="flex h-full flex-1 flex-col gap-4 bg-canvas-soft p-5 text-[13px]">
                <PageHeader
                    title="Sales Hub"
                    description="Live in CRM the way you live in EvoDesk. Next steps are open tasks."
                >
                    <Button asChild>
                        <a href={sharedDesk}>Open Desk</a>
                    </Button>
                </PageHeader>

                <div className="grid gap-3 md:grid-cols-5">
                    {[
                        ['Open deals', String(stats.open_deals), '/crm/deals'],
                        ['Open pipeline', formatDzd(stats.open_pipeline_cents), '/crm/reports'],
                        ['Open tasks', String(stats.open_tasks), '/dashboard'],
                        ['Unread (synced)', String(stats.inbox_unread), '/conversations'],
                        ['Enrolled', String(stats.sequences_enrolled), '/outbound/sequences'],
                    ].map(([label, value, href]) => (
                        <Link key={label} href={href}>
                            <Card className="rounded-none p-3">
                                <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                                <p className={`mt-1 text-xl font-semibold ${label === 'Open pipeline' ? 'money' : ''}`}>{value}</p>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Card className="rounded-none p-4">
                    <h2 className="font-medium">Today’s next steps</h2>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                        Open tasks with due dates. Create them from a contact or deal sidebar.
                    </p>
                    {nextSteps.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">No open tasks.</p>
                    ) : (
                        <table className="mt-3 w-full">
                            <thead className="text-left text-[11px] uppercase text-muted-foreground">
                                <tr>
                                    <th className="py-1">Task</th>
                                    <th className="py-1">Contact / deal</th>
                                    <th className="py-1">Due</th>
                                    <th className="py-1">Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nextSteps.map((task) => (
                                    <tr key={task.id} className="border-t">
                                        <td className="py-1.5">{task.subject ?? task.body}</td>
                                        <td className="py-1.5">
                                            {task.deal ? (
                                                <Link href={`/crm/deals/${task.deal.id}`} className="text-brand">
                                                    {task.deal.title}
                                                </Link>
                                            ) : task.contact ? (
                                                <Link href={`/crm/contacts/${task.contact.id}`} className="text-brand">
                                                    {task.contact.first_name} {task.contact.last_name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="py-1.5">{task.due_at ?? '—'}</td>
                                        <td className="py-1.5">{task.owner?.name ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                    <Card className="space-y-2 rounded-none p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Evolution / WhatsApp Cloud</h2>
                            <Badge variant={evolution.connected ? 'default' : 'secondary'}>
                                {evolution.connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Mode {evolution.mode}. Baileys, QR, and Linked-devices are refused.
                        </p>
                        {evolution.reason ? (
                            <p className="text-amber-700 dark:text-amber-300">{evolution.reason}</p>
                        ) : null}
                        <Link href="/settings/evolution" className="text-brand">
                            Open Evolution settings
                        </Link>
                    </Card>
                    <Card className="space-y-2 rounded-none p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-medium">Meta Ads</h2>
                            <Badge variant={meta_connected ? 'default' : 'secondary'}>
                                {meta_connected ? 'Connected' : 'Not connected'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">Env-driven. Ads leads today: {stats.ads_leads_today}.</p>
                        <Link href="/ads" className="text-brand">
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
