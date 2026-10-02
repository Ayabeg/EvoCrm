import { useState } from 'react';
import type { ReactNode } from 'react';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Check, Copy } from '@/evo/icons';
import { OutboundSection } from '@/evo/outbound/section';
import { statusTone } from '@/evo/outbound/status';
import type { DomainChecklistItem, DomainRow } from '@/evo/outbound/types';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

function CopyRecord({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            type="button"
            title={t('Copy record')}
            className="inline-flex items-center gap-1 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] px-2 py-0.5 text-[11px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)]"
            onClick={() => {
                void navigator.clipboard?.writeText(value);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
            }}
        >
            {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            {copied ? t('Copied') : t('Copy')}
        </button>
    );
}

export type DomainListProps = {
    domains: DomainRow[];
    renderActions?: (domain: DomainRow) => ReactNode;
    renderEditor?: (domain: DomainRow) => ReactNode;
};

export function DomainList({ domains, renderActions, renderEditor }: DomainListProps) {
    const columns: EvoDataGridColumn<DomainChecklistItem>[] = [
        { id: 'label', header: t('Record'), accessorFn: (row) => row.label },
        { id: 'type', header: t('Type'), accessorFn: (row) => row.type },
        {
            id: 'host',
            header: t('Host'),
            accessorFn: (row) => row.host,
            cell: ({ row }) => (
                <span className="font-mono text-[11px]">{row.original.host}</span>
            ),
        },
        {
            id: 'value',
            header: t('Value to publish'),
            cell: ({ row }) =>
                row.original.value ? (
                    <span className="block max-w-96 truncate font-mono text-[11px]" title={row.original.value}>
                        {row.original.value}
                    </span>
                ) : (
                    <span className="text-[var(--evo-danger)]">{t('missing — paste it below')}</span>
                ),
        },
        {
            id: 'copy',
            header: t('Copy'),
            enableSorting: false,
            cell: ({ row }) => (row.original.value ? <CopyRecord value={row.original.value} /> : null),
        },
    ];

    if (domains.length === 0) {
        return (
            <p className="border-t border-[var(--evo-hairline)] py-4 text-[13px] text-[var(--evo-ink-muted)]">
                {t('No sending domain yet. Add the domain your From addresses use.')}
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {domains.map((domain) => (
                <article key={domain.id} className="space-y-3 border-t border-[var(--evo-hairline)] pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--evo-ink)]">{domain.domain}</span>
                        <Status tone={statusTone(domain.status)} label={t(domain.status)} />
                        {domain.verified_at ? (
                            <span className="text-[11px] text-[var(--evo-ink-muted)]">
                                {t('verified :when', { when: domain.verified_at })}
                            </span>
                        ) : null}
                        <span className="ms-auto flex items-center gap-2">{renderActions?.(domain)}</span>
                    </div>
                    <DataGrid
                        columns={columns}
                        data={domain.checklist}
                        getRowId={(row) => row.key}
                        density="compact"
                        enableSelection={false}
                    />
                    {renderEditor ? (
                        <details className="rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] px-3 py-2">
                            <summary className="cursor-pointer text-[12px] font-medium text-[var(--evo-ink-muted)]">
                                {t('Edit records')}
                            </summary>
                            {renderEditor(domain)}
                        </details>
                    ) : null}
                </article>
            ))}
        </div>
    );
}

export { OutboundSection };
