import { Form, Link } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { formatMoney, formatNumber } from '@/evo/lib/format';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

import type { CrossObjectReport, ReportResult, SavedReportRow } from './types';

function formatBuilderValue(result: ReportResult): string {
    if (result.metric === 'sum_amount') {
        return formatMoney(result.value);
    }

    return formatNumber(result.value);
}

export function ReportBuilderForm({
    reports,
    result,
    activeReport,
    crossObject,
    preview = false,
}: {
    reports: SavedReportRow[];
    result?: ReportResult;
    activeReport?: SavedReportRow | null;
    crossObject?: CrossObjectReport;
    preview?: boolean;
}) {
    const onPreviewSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    const crossLink = preview ? (
        <span className="text-[13px] text-[var(--evo-teal)]">{t('Cross-object: reply rate by wilaya')}</span>
    ) : (
        <Link
            href="/crm/report-builder/cross-object"
            className="text-[13px] text-[var(--evo-teal)] underline-offset-2 hover:underline"
        >
            {t('Cross-object: reply rate by wilaya')}
        </Link>
    );

    const fields = (
        <>
            <Input name="name" placeholder={t('Report name')} required defaultValue={activeReport?.name} />
            <NativeSelect name="entity" defaultValue={activeReport?.entity ?? 'deal'}>
                <option value="deal">{t('Deals')}</option>
                <option value="contact">{t('Contacts')}</option>
            </NativeSelect>
            <NativeSelect name="metric" defaultValue={activeReport?.metric ?? 'count'}>
                <option value="count">{t('Count')}</option>
                <option value="sum_amount">{t('Sum amount')}</option>
            </NativeSelect>
            <NativeSelect name="group_by" defaultValue={activeReport?.group_by ?? ''}>
                <option value="">{t('No grouping')}</option>
                <option value="stage">{t('Group by stage')}</option>
                <option value="owner">{t('Group by owner')}</option>
            </NativeSelect>
            <Button type="submit">{t('Save report')}</Button>
        </>
    );

    const form = preview ? (
        <form
            onSubmit={onPreviewSubmit}
            className="grid gap-2 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
        >
            {fields}
        </form>
    ) : (
        <Form
            action="/crm/report-builder"
            method="post"
            className="grid gap-2 rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
        >
            {fields}
        </Form>
    );

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            {crossLink}
            {form}
            <div className="space-y-2">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className="flex items-center justify-between rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] px-3 py-2 text-[13px]"
                    >
                        <span>
                            {report.name} · {report.entity} · {report.metric}
                        </span>
                        {preview ? (
                            <span className="text-[var(--evo-teal)]">{t('Run')}</span>
                        ) : (
                            <Link
                                href={`/crm/report-builder/${report.id}/run`}
                                className="text-[var(--evo-teal)] underline-offset-2 hover:underline"
                            >
                                {t('Run')}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
            {result && activeReport ? (
                <div className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] p-4 text-[13px]">
                    <p className="font-semibold">{activeReport.name}</p>
                    <p className="mt-2 tabular-nums">
                        {result.metric}: {formatBuilderValue(result)}
                    </p>
                    {result.groups?.map((group) => (
                        <p key={group.label} className="text-[var(--evo-ink-muted)]">
                            {group.label}: {formatBuilderValue({ ...result, value: group.value })}
                        </p>
                    ))}
                </div>
            ) : null}
            {crossObject?.groups?.length ? <CrossObjectReportPanel report={crossObject} /> : null}
        </div>
    );
}

export function CrossObjectReportPanel({ report }: { report: CrossObjectReport }) {
    return (
        <div
            className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] p-4 text-[13px]"
            data-report="cross-object"
        >
            <p className="font-semibold">{t('Reply rate by wilaya')}</p>
            {report.groups.map((row) => (
                <p key={row.label} className="text-[var(--evo-ink-muted)]">
                    {t(':label: :value% reply rate (:count sent)', {
                        label: row.label,
                        value: row.value,
                        count: row.count,
                    })}
                </p>
            ))}
        </div>
    );
}
