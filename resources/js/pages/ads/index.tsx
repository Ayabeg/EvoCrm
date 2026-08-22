import { Head } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AdsIndex({
    accounts,
    campaigns,
    leads,
    meta,
}: {
    accounts: any[];
    campaigns: any[];
    leads: any[];
    meta: { connected: boolean; reason: string | null };
}) {
    return (
        <>
            <Head title="Ads Center" />
            <div className="flex-1 space-y-6 p-6">
                <PageHeader
                    title="Ads Center"
                    description="Meta ad accounts, campaigns, click-to-WhatsApp, and lead forms. Env-driven — never invent app IDs."
                />
                <Card className="p-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={meta.connected ? 'default' : 'secondary'}>
                            {meta.connected ? 'Meta connected' : 'Meta not connected'}
                        </Badge>
                    </div>
                    {meta.reason ? (
                        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{meta.reason}</p>
                    ) : null}
                    <p className="mt-3 text-sm text-muted-foreground">
                        Click-to-WhatsApp landings arrive as Evolution Cloud webhooks and become Desk threads.
                        Lead forms POST to <code>/webhooks/meta/leads</code> and create Contact + Lead.
                    </p>
                </Card>
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Ad accounts</h2>
                        {accounts.length === 0 ? <p className="text-muted-foreground">None yet</p> : null}
                        {accounts.map((account) => (
                            <p key={account.id}>
                                {account.name} · {account.status}
                            </p>
                        ))}
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Campaigns</h2>
                        {campaigns.length === 0 ? <p className="text-muted-foreground">None yet</p> : null}
                        {campaigns.map((campaign) => (
                            <p key={campaign.id}>
                                {campaign.name}
                                {campaign.click_to_whatsapp ? ' · CTWA' : ''}
                                {campaign.lead_form ? ' · Lead form' : ''}
                            </p>
                        ))}
                    </Card>
                    <Card className="p-4 text-sm">
                        <h2 className="mb-2 font-medium">Ad leads</h2>
                        {leads.length === 0 ? <p className="text-muted-foreground">None yet</p> : null}
                        {leads.map((lead) => (
                            <p key={lead.id}>
                                {lead.contact?.first_name ?? 'Lead'} · form {lead.form_id ?? '—'}
                            </p>
                        ))}
                    </Card>
                </div>
            </div>
        </>
    );
}

AdsIndex.layout = {
    breadcrumbs: [{ title: 'Ads', href: '/ads' }],
};
