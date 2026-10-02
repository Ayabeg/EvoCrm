import type { ReactNode } from 'react';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { statusTone } from '@/evo/outbound/status';
import type { MailboxRow } from '@/evo/outbound/types';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type MailboxListProps = {
    mailboxes: MailboxRow[];
    renderActions?: (box: MailboxRow) => ReactNode;
    renderAfter?: (box: MailboxRow) => ReactNode;
};

export function MailboxList({ mailboxes, renderActions, renderAfter }: MailboxListProps) {
    const columns: EvoDataGridColumn<MailboxRow>[] = [
        {
            id: 'mailbox',
            header: t('Mailbox'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--evo-ink)]">
                        {row.original.name}
                        {row.original.is_default ? (
                            <Status tone="neutral" label={t('default')} />
                        ) : null}
                        {row.original.source === 'mail_stack' ? (
                            <Status tone="info" label={t('Mail stack')} />
                        ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--evo-ink-muted)]">
                        {row.original.from_name} &lt;{row.original.from_address}&gt;
                    </p>
                    {renderAfter?.(row.original)}
                </div>
            ),
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.effective_status,
            cell: ({ row }) => (
                <Status
                    tone={statusTone(row.original.effective_status)}
                    label={t(row.original.effective_status)}
                />
            ),
        },
        {
            id: 'smtp',
            header: t('SMTP host'),
            accessorFn: (row) => `${row.host ?? ''}:${row.port ?? ''}`,
            cell: ({ row }) => (
                <span className="text-[12px] text-[var(--evo-ink-muted)]">
                    {row.original.host}:{row.original.port} ({row.original.encryption})
                </span>
            ),
        },
        {
            id: 'imap',
            header: t('IMAP replies'),
            accessorFn: (row) => (row.imap_configured ? t('replies on') : t('off')),
        },
        {
            id: 'sent',
            header: t('Sent today'),
            cell: ({ row }) => (
                <div>
                    <span className="tabular-nums">
                        {row.original.sent_today}/{row.original.daily_limit}
                    </span>
                    {row.original.last_tested_at ? (
                        <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                            {t('tested :when', { when: row.original.last_tested_at })}
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'actions',
            header: t('Actions'),
            enableSorting: false,
            cell: ({ row }) => renderActions?.(row.original) ?? null,
        },
    ];

    return (
        <DataGrid
            columns={columns}
            data={mailboxes}
            getRowId={(row) => String(row.id)}
            density="compact"
            enableSelection={false}
            emptyTitle={t('No mailbox - SMTP is disabled.')}
        />
    );
}
