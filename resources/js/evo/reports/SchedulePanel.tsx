import type { FormEvent } from 'react';

import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

import type { ReportSchedule, SavedReportRow } from './types';

export function SchedulePanel({
    schedules,
    savedReports,
    onToggle,
    onDelete,
    onCreate,
}: {
    schedules: ReportSchedule[];
    savedReports: SavedReportRow[];
    onToggle: (schedule: ReportSchedule) => void;
    onDelete: (schedule: ReportSchedule) => void;
    onCreate: (payload: {
        name: string;
        saved_report_id: string | null;
        cron: string;
        recipients: string[];
    }) => void;
}) {
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const recipients = String(data.get('recipients') ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        onCreate({
            name: String(data.get('name') ?? ''),
            saved_report_id: String(data.get('saved_report_id') ?? '') || null,
            cron: String(data.get('cron') ?? '0 8 * * 1'),
            recipients,
        });
    };

    return (
        <section className="mb-4 border-t border-[var(--evo-hairline)] pt-3 text-sm">
            <h2 className="mb-3 text-[11px] text-[var(--evo-ink-muted)]">{t('Scheduled reports')}</h2>
            {schedules.length === 0 ? (
                <p className="mb-3 text-[12px] text-[var(--evo-ink-muted)]">{t('No schedules yet.')}</p>
            ) : (
                <ul className="mb-3 space-y-1 text-[12px]">
                    {schedules.map((schedule) => (
                        <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                                {schedule.name ?? t('Untitled')} · {schedule.cron} ·{' '}
                                {schedule.active ? t('active') : t('paused')} ·{' '}
                                {schedule.last_status ?? t('never sent')}
                            </span>
                            <span className="flex gap-1">
                                <button
                                    type="button"
                                    className="text-[var(--evo-ink)] hover:underline"
                                    onClick={() => onToggle(schedule)}
                                >
                                    {schedule.active ? t('Pause') : t('Resume')}
                                </button>
                                <button
                                    type="button"
                                    className="text-[var(--evo-danger)]"
                                    onClick={() => onDelete(schedule)}
                                >
                                    {t('Delete')}
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <form className="grid gap-2 md:grid-cols-4" onSubmit={submit}>
                <Input name="name" placeholder={t('Schedule name')} className="h-8" />
                <NativeSelect name="saved_report_id" className="h-8">
                    <option value="">{t('Saved report…')}</option>
                    {savedReports.map((report) => (
                        <option key={report.id} value={report.id}>
                            {report.name}
                        </option>
                    ))}
                </NativeSelect>
                <Input name="cron" defaultValue="0 8 * * 1" className="h-8 font-mono text-[12px]" />
                <Input name="recipients" placeholder={t('a@b.com, c@d.com')} className="h-8" />
                <Button type="submit" variant="outline" size="sm" className="md:col-span-4">
                    {t('Create schedule')}
                </Button>
            </form>
        </section>
    );
}
