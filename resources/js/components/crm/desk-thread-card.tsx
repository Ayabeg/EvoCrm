import { Link } from '@inertiajs/react';
import { AssociationCard } from '@/components/crm/record-chrome';
import { t } from '@/lib/i18n';

export type DeskThreadPreview = {
    id?: number;
    thread_id?: number;
    subject?: string | null;
    last_message?: string | null;
    last_message_at?: string | null;
    direction?: string | null;
};

export default function DeskThreadCard({
    thread,
    inboxHref = '/inbox',
}: {
    thread?: DeskThreadPreview | null;
    inboxHref?: string;
}) {
    const threadId = thread?.thread_id ?? thread?.id;
    const href = threadId
        ? `/conversations?thread=${threadId}`
        : inboxHref;

    return (
        <AssociationCard title="Desk + WhatsApp" addHref={href} addLabel={t('Open')}>
            {thread?.last_message || thread?.subject ? (
                <div>
                    <p className="text-[13px] text-ink">
                        {thread.last_message ?? thread.subject}
                    </p>
                    <p className="text-[11px] text-mute">
                        {thread.direction === 'outbound' ? t('Sent') : t('Received')}
                        {thread.last_message_at
                            ? ` · ${String(thread.last_message_at).slice(0, 16)}`
                            : ''}
                    </p>
                    <Link
                        href={href}
                        className="mt-1 inline-flex text-[12px] font-medium text-ink hover:underline"
                    >
                        {t('Continue on WhatsApp')}
                    </Link>
                </div>
            ) : (
                <p className="text-mute">
                    {t('No Slack. Open Desk to start a WhatsApp Cloud thread.')}
                </p>
            )}
        </AssociationCard>
    );
}
