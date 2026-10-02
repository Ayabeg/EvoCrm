import type { FormEvent, ReactNode } from 'react';

import { Button } from '@/evo/ui/button';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

import type { ReportOwner } from './types';

export function ReportsFilters({
    from,
    to,
    owner,
    owners,
    custom,
    onFrom,
    onTo,
    onOwner,
    onApply,
    onReset,
    extra,
    ariaLabel,
}: {
    from: string;
    to: string;
    owner?: string;
    owners?: ReportOwner[];
    custom?: boolean;
    onFrom: (value: string) => void;
    onTo: (value: string) => void;
    onOwner?: (value: string) => void;
    onApply: (event: FormEvent) => void;
    onReset?: () => void;
    extra?: ReactNode;
    ariaLabel?: string;
}) {
    return (
        <form
            onSubmit={onApply}
            className="flex flex-wrap items-end gap-2"
            aria-label={ariaLabel ?? t('Dashboard filters')}
        >
            {owners && onOwner ? (
                <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                    {t('Owner')}
                    <NativeSelect
                        value={owner ?? ''}
                        onChange={(event) => onOwner(event.target.value)}
                        aria-label={t('Owner')}
                        className="h-8"
                    >
                        <option value="">{t('All owners')}</option>
                        {owners.map((person) => (
                            <option key={person.id} value={person.id}>
                                {person.name}
                            </option>
                        ))}
                    </NativeSelect>
                </label>
            ) : null}
            {extra}
            <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                {t('From')}
                <input
                    type="date"
                    name="from"
                    value={from}
                    max={to}
                    onChange={(event) => onFrom(event.target.value)}
                    className="h-8 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-2 text-[13px] text-[var(--evo-ink)] normal-case"
                />
            </label>
            <label className="grid gap-1 text-[11px] tracking-wide text-[var(--evo-ink-muted)] uppercase">
                {t('To')}
                <input
                    type="date"
                    name="to"
                    value={to}
                    min={from}
                    onChange={(event) => onTo(event.target.value)}
                    className="h-8 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-surface)] px-2 text-[13px] text-[var(--evo-ink)] normal-case"
                />
            </label>
            <Button type="submit" variant="outline" size="sm">
                {t('Apply')}
            </Button>
            {custom && onReset ? (
                <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                    {t('Last 30 days')}
                </Button>
            ) : null}
        </form>
    );
}
