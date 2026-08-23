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
                        <p className="mt-2 text-sm text-brand">{meta.reason}</p>
                    ) : null}
                    {!meta.connected ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Demo campaigns below are local seed data. Live Meta sync stays off until{' '}
                            <code>META_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> are set.
                        </p>
                    ) : null}
                    <p className="mt-3 text-sm text-muted-foreground">
                        Click-to-WhatsApp landings arrive as Evolution Cloud webhooks. Lead forms POST to{' '}
                        <code>/webhooks/meta/leads</code> and create Contact + Lead.
                    </p>
                </Card>
                {campaigns.length === 0 ? (
                    <Card className="p-6 text-sm text-muted-foreground">
                        No campaigns yet. Meta is not connected — seed demo rows appear after{' '}
                        <code>php artisan db:seed</code>.
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-2">Campaign</th>
                                    <th className="px-4 py-2">Account</th>
                                    <th className="px-4 py-2">Objective</th>
                                    <th className="px-4 py-2">Kind</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-t">
                                        <td className="px-4 py-2 font-medium">{campaign.name}</td>
                                        <td className="px-4 py-2">{campaign.account?.name ?? '—'}</td>
                                        <td className="px-4 py-2">{campaign.objective ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            {campaign.click_to_whatsapp ? 'CTWA' : ''}
                                            {campaign.click_to_whatsapp && campaign.lead_form ? ' + ' : ''}
                                            {campaign.lead_form ? 'Lead form' : ''}
                                        </td>
                                        <td className="px-4 py-2">{campaign.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
                <div className="grid gap-4 lg:grid-cols-2">
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
                        <h2 className="mb-2 font-medium">Lead-form rows</h2>
                        {leads.length === 0 ? <p className="text-muted-foreground">No form submissions today or in seed.</p> : null}
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
