import { router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { AudienceList } from '@/evo/outbound/AudienceList';
import type { AudienceListRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export default function OutboundListsIndex({ lists }: { lists: AudienceListRow[] }) {
    return (
        <OutboundShell title={t('List')}>
            <OutboundPage
                title={t('Audience lists')}
                description={t('Contact segments for outbound campaigns.')}
                actions={
                    <Button variant="link" size="sm" onClick={() => router.visit('/crm/segments')}>
                        {t('Manage segments')}
                    </Button>
                }
            >
                <AudienceList
                    lists={lists}
                    onOpenCampaign={(id) => router.visit(`/outbound/campaigns/${id}`)}
                    onOpenMembers={(id) => router.visit(`/crm/contacts?filter_id=${id}`)}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

OutboundListsIndex.layout = {
    breadcrumbs: [
        { title: t('Outbound'), href: '/outbound' },
        { title: t('List'), href: '/outbound/lists' },
    ],
};
