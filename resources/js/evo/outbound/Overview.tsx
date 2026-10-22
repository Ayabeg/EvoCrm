import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { formatDateTime, formatNumber } from '@/evo/lib/format';
import { OutboundSection } from '@/evo/outbound/section';
import { contactName, statusTone } from '@/evo/outbound/status';
import type { MailboxRow, OutboundMessageRow, OverviewStats } from '@/evo/outbound/types';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

export type OverviewProps = {
    stats: OverviewStats;
    mailboxHealth: MailboxRow[];
    recent: OutboundMessageRow[];
    mailStack: {
        configured: boolean;
        smtp_host: string;
        smtp_port: number;
        imap_host: string;
        imap_port: number;
        roundcube_url: string;
    };
    onOpenMailbox?: () => void;
    onOpenContact?: (id: string | number) => void;
    onOpenSequence?: (id: string | number) => void;
    onOpenCampaign?: (id: string | number) => void;
};

export function Overview({
    stats,
    mailboxHealth,
    recent,
    mailStack,
    onOpenMailbox,
    onOpenContact,
    onOpenSequence,
    onOpenCampaign,
}: OverviewProps) {
    const mailboxColumns: EvoDataGridColumn<MailboxRow>[] = [
        {
            id: 'mailbox',
            header: t('Mailbox'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div>
                    <button
                        type="button"
                        className="font-medium text-[var(--evo-ink)] underline-offset-2 hover:underline"
                        onClick={onOpenMailbox}
                    >
                        {row.original.name}
                    </button>
                    <span className="block text-[11px] text-[var(--evo-ink-muted)]">
                        {row.original.from_address}
                    </span>
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
            id: 'imap',
            header: t('IMAP replies'),
            accessorFn: (row) => (row.imap_configured ? t('on') : t('off')),
        },
        {
            id: 'sent',
            header: t('Sent today'),
            accessorFn: (row) => `${row.sent_today}/${row.daily_limit}`,
            cell: ({ row }) => (
                <span className="tabular-nums">
                    {row.original.sent_today}/{row.original.daily_limit}
                </span>
            ),
        },
        {
            id: 'tested',
            header: t('Last test'),
            accessorFn: (row) => row.last_tested_at ?? t('never'),
            cell: ({ row }) => (
                <span className="text-[var(--evo-ink-muted)]">
                    {row.original.last_tested_at
                        ? formatDateTime(row.original.last_tested_at)
                        : t('never')}
                </span>
            ),
        },
    ];

    const recentColumns: EvoDataGridColumn<OutboundMessageRow>[] = [
        {
            id: 'direction',
            header: t('Direction'),
            accessorFn: (row) => row.direction,
            cell: ({ row }) => (
                <Status
                    tone={row.original.direction === 'in' ? 'success' : 'neutral'}
                    label={
                        row.original.direction === 'in'
                            ? t('reply')
                            : t(row.original.channel ?? 'email')
                    }
                />
            ),
        },
        {
            id: 'contact',
            header: t('Contact'),
            accessorFn: (row) => contactName(row.contact) || row.to_address,
            cell: ({ row }) => {
                const name = contactName(row.original.contact);

                if (row.original.contact && onOpenContact) {
                    return (
                        <button
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenContact(row.original.contact!.id)}
                        >
                            {name}
                        </button>
                    );
                }

                return name || row.original.to_address;
            },
        },
        {
            id: 'subject',
            header: t('Subject'),
            accessorFn: (row) => row.subject ?? '—',
        },
        {
            id: 'source',
            header: t('Source'),
            cell: ({ row }) => {
                if (row.original.sequence && onOpenSequence) {
                    return (
                        <button
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenSequence(row.original.sequence!.id)}
                        >
                            {row.original.sequence.name}
                        </button>
                    );
                }

                if (row.original.campaign && onOpenCampaign) {
                    return (
                        <button
                            type="button"
                            className="text-[var(--evo-ink)] underline-offset-2 hover:underline"
                            onClick={() => onOpenCampaign(row.original.campaign!.id)}
                        >
                            {row.original.campaign.name}
                        </button>
                    );
                }

                return '—';
            },
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status,
            cell: ({ row }) => (
                <div>
                    <Status tone={statusTone(row.original.status)} label={t(row.original.status)} />
                    {row.original.defer_reason ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--evo-ink-muted)]">
                            {t('deferred')} · {row.original.defer_reason.replaceAll('_', ' ')}
                        </span>
                    ) : null}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <p className="text-[13px] text-[var(--evo-ink-secondary)]">
                {t(
                    'Mailboxes, sending domains, templates, sequences, broadcast campaigns, suppression, and quiet hours. WhatsApp stays official Cloud templates only.',
                )}
            </p>

            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--evo-hairline)] pb-3">
                <div>
                    <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                        {t('Live mail stack')}
                    </h2>
                    <p className="mt-1 max-w-3xl text-[11px] text-[var(--evo-ink-muted)]">
                        {t(
                            'SMTP :host::port · IMAP :imapHost::imapPort · webmail is Roundcube on the same host. :sync Campaigns and sequences live here in the CRM.',
                            {
                                host: mailStack.smtp_host,
                                port: mailStack.smtp_port,
                                imapHost: mailStack.imap_host,
                                imapPort: mailStack.imap_port,
                                sync: mailStack.configured
                                    ? t('Mailboxes sync from the stack automatically.')
                                    : t('Set EVOSALES_MAIL_API_TOKEN to sync mailboxes automatically.'),
                            },
                        )}
                    </p>
                </div>
                <a
                    className="shrink-0 text-[13px] text-[var(--evo-ink)] underline-offset-2 hover:underline"
                    href={mailStack.roundcube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t('Open Roundcube')}
                </a>
            </div>

            <CrmKpiStrip
                columns={4}
                kpis={[
                    { key: 'sent', label: t('Sent · 30d'), value: formatNumber(stats.sent_30d), href: '/outbound/outbox' },
                    { key: 'deferred', label: t('Deferred'), value: formatNumber(stats.deferred), href: '/outbound/outbox?status=deferred' },
                    { key: 'replies', label: t('Replies · 30d'), value: formatNumber(stats.replies_30d), href: '/outbound/replies' },
                    { key: 'suppressed', label: t('Suppressed'), value: formatNumber(stats.suppressed), href: '/outbound/suppressions' },
                    { key: 'failed', label: t('Failed · 30d'), value: formatNumber(stats.failed_30d), href: '/outbound/outbox?status=failed' },
                    { key: 'delivered', label: t('Delivered · 30d'), value: formatNumber(stats.delivered_30d ?? 0), href: '/outbound/outbox' },
                    { key: 'complaints', label: t('Complaints · 30d'), value: formatNumber(stats.complaints_30d ?? 0), href: '/outbound/suppressions' },
                    {
                        key: 'campaigns',
                        label: t('Campaigns'),
                        value: t(':sending live · :sent sent', {
                            sending: stats.campaigns_sending,
                            sent: stats.campaigns_sent,
                        }),
                        href: '/outbound/campaigns',
                    },
                    {
                        key: 'sequences',
                        label: t('Sequences'),
                        value: t(':active active · :enrolled enrolled', {
                            active: stats.sequences_active,
                            enrolled: stats.enrolled_active,
                        }),
                        href: '/outbound/sequences',
                    },
                    {
                        key: 'domains',
                        label: t('Domains'),
                        value: t(':verified/:total verified', {
                            verified: stats.domains_verified,
                            total: stats.domains,
                        }),
                        href: '/outbound/domains',
                    },
                ]}
            />

            <OutboundSection
                title={`${t('Mailbox health')} ${t('— :enabled/:total enabled', {
                    enabled: stats.mailboxes_enabled,
                    total: stats.mailboxes,
                })}`}
            >
                <DataGrid
                    columns={mailboxColumns}
                    data={mailboxHealth}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t(
                        'No mailbox yet — add one under Mailboxes, enable it, and send a test.',
                    )}
                />
            </OutboundSection>

            <OutboundSection title={t('Recent activity')}>
                <DataGrid
                    columns={recentColumns}
                    data={recent}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    emptyTitle={t(
                        'Nothing sent yet. Create a mailbox, then enroll contacts in a sequence or send a campaign.',
                    )}
                />
            </OutboundSection>
        </div>
    );
}
