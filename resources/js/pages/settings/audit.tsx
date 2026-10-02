import { Head } from '@inertiajs/react';
import { Card } from '@/evo/ui/card';
import { SettingsPageHeader } from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';

type AuditRow = {
    id: number;
    action: string;
    summary: string;
    actor: string | null;
    ip: string | null;
    created_at: string | null;
};

function stamp(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function AuditSettings({ events }: { events: AuditRow[] }) {
    return (
        <>
            <Head title={t('Audit trail')} />
            <div className="space-y-3">
                <SettingsPageHeader
                    title="Audit trail"
                    description="Workspace logins, imports, merges, quotes, and permission changes."
                />
                <Card className="overflow-hidden border-hairline bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-canvas-soft text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-2">{t('When')}</th>
                                <th className="px-4 py-2">{t('Actor')}</th>
                                <th className="px-4 py-2">{t('Action')}</th>
                                <th className="px-4 py-2">{t('Summary')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        {t('No audit events yet.')}
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {stamp(event.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {event.actor ?? t('System')}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {event.action}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {event.summary}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>
        </>
    );
}
