import { router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Outbox } from '@/evo/outbound/Outbox';
import type { OutboundMessageRow } from '@/evo/outbound/types';
import { t } from '@/lib/i18n';

export default function OutboxPage({
    messages,
    status,
    counts,
}: {
    messages: OutboundMessageRow[];
    status: string;
    counts: { queued: number; deferred: number; sent: number; failed: number };
}) {
    return (
        <OutboundShell title={t('Outbox')}>
            <OutboundPage
                title={t('Outbox')}
                description={t(
                    'Every dispatch attempt is logged here — queued, deferred by quiet hours or a daily cap, sent, or failed with the reason.',
                )}
            >
                <Outbox
                    messages={messages}
                    status={status}
                    counts={counts}
                    onFilter={(filter) =>
                        router.get('/outbound/outbox', filter ? { status: filter } : {}, {
                            preserveState: true,
                        })
                    }
                    onOpenContact={(id) => router.visit(`/crm/contacts/${id}`)}
                    onOpenSequence={(id) => router.visit(`/outbound/sequences/${id}`)}
                    onOpenCampaign={(id) => router.visit(`/outbound/campaigns/${id}`)}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

OutboxPage.layout = {
    breadcrumbs: [{ title: t('Outbox'), href: '/outbound/outbox' }],
};
