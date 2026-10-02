import { router } from '@inertiajs/react';
import { OutboundShell } from '@/components/crm/outbound-shell';
import { Overview } from '@/evo/outbound/Overview';
import type { MailboxRow, OutboundMessageRow, OverviewStats } from '@/evo/outbound/types';
import { t } from '@/lib/i18n';

export default function OutboundIndex({
    stats,
    mailboxHealth,
    recent,
    mail_stack,
}: {
    stats: OverviewStats;
    mailboxHealth: MailboxRow[];
    recent: OutboundMessageRow[];
    mail_stack: {
        configured: boolean;
        smtp_host: string;
        smtp_port: number;
        imap_host: string;
        imap_port: number;
        roundcube_url: string;
    };
}) {
    return (
        <OutboundShell title={t('Outbound')}>
            <div className="space-y-4 px-4 py-3 md:px-5 md:py-4">
                <Overview
                    stats={stats}
                    mailboxHealth={mailboxHealth}
                    recent={recent}
                    mailStack={mail_stack}
                    onOpenMailbox={() => router.visit('/outbound/mailboxes')}
                    onOpenContact={(id) => router.visit(`/crm/contacts/${id}`)}
                    onOpenSequence={(id) => router.visit(`/outbound/sequences/${id}`)}
                    onOpenCampaign={(id) => router.visit(`/outbound/campaigns/${id}`)}
                />
            </div>
        </OutboundShell>
    );
}

OutboundIndex.layout = {
    breadcrumbs: [{ title: t('Outbound'), href: '/outbound' }],
};
