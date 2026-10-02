import { Head, Link, router } from '@inertiajs/react';
import {
    CrmObjectHeader,
    CrmObjectSecondaryLink,
} from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { t } from '@/lib/i18n';

type HistoryRow = {
    id: number;
    contact_id: number;
    contact_name: string;
    entered_at: string | null;
    exited_at: string | null;
    status: 'current' | 'exited';
};

export default function SegmentShow({
    segment,
    history,
}: {
    segment: { id: number; name: string; entity: string };
    history: HistoryRow[];
}) {
    const listHref =
        segment.entity === 'deal'
            ? `/crm/deals?filter_id=${segment.id}`
            : `/crm/contacts?filter_id=${segment.id}`;

    return (
        <CrmShell title={segment.name} chrome="workspace">
            <Head title={segment.name} />
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink"
                data-crm="list-workspace"
            >
                <CrmObjectHeader
                    title={segment.name}
                    description={t('Membership history for this segment. Current members stay on the filtered list.')}
                    secondary={
                        <>
                            <CrmObjectSecondaryLink href="/crm/segments">
                                {t('All segments')}
                            </CrmObjectSecondaryLink>
                            <CrmObjectSecondaryLink href={listHref}>
                                {t('Current members')}
                            </CrmObjectSecondaryLink>
                        </>
                    }
                />
                <div className="flex min-h-0 flex-1 flex-col bg-canvas">
                    {history.length === 0 ? (
                        <CrmEmptyState
                            title={t('No history yet')}
                            line={t('No enter or exit history for this segment.')}
                        />
                    ) : (
                        <div className="min-h-0 flex-1 overflow-auto">
                            <table
                                className="w-full min-w-[480px] border-collapse text-[13px]"
                                aria-label={t('Membership history')}
                            >
                                <thead>
                                    <tr className="border-b border-hairline bg-canvas-soft text-left">
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:px-6">
                                            {t('Contact')}
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                            {t('Entered')}
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute">
                                            {t('Exited')}
                                        </th>
                                        <th className="px-4 py-1.5 text-[11px] font-medium text-mute sm:pr-6">
                                            {t('Status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="cursor-pointer border-b border-hairline hover:bg-canvas-soft"
                                            onClick={(event) => {
                                                const target = event.target as HTMLElement;

                                                if (target.closest('a, input, button, label')) {
                                                    return;
                                                }

                                                router.visit(`/crm/contacts/${row.contact_id}`);
                                            }}
                                        >
                                            <td className="px-4 py-1.5 sm:px-6">
                                                <Link
                                                    href={`/crm/contacts/${row.contact_id}`}
                                                    className="font-medium text-ink hover:underline"
                                                >
                                                    {row.contact_name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-1.5 text-mute">
                                                {row.entered_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-1.5 text-mute">
                                                {row.exited_at ?? '—'}
                                            </td>
                                            <td className="px-4 py-1.5 capitalize text-mute sm:pr-6">
                                                {t(row.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <CrmListFooter count={history.length} noun="events" />
                </div>
            </div>
        </CrmShell>
    );
}

SegmentShow.layout = {
    breadcrumbs: [
        { title: 'Segments', href: '/crm/segments' },
        { title: 'History', href: '' },
    ],
};
