import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Moon, Sun } from '@/evo/icons';
import { WEEK_STARTS_ON, formatMoney, formatPhone, formatTime } from '@/evo/lib/format';
import { CampaignList } from '@/evo/outbound/CampaignList';
import { CampaignWorkspace } from '@/evo/outbound/CampaignWorkspace';
import { DomainList } from '@/evo/outbound/DomainList';
import { MailboxList } from '@/evo/outbound/MailboxList';
import { outboundMessages } from '@/evo/outbound/messages';
import { Outbox } from '@/evo/outbound/Outbox';
import { Overview } from '@/evo/outbound/Overview';
import { OutboundReports } from '@/evo/outbound/Reports';
import { SequenceBuilder } from '@/evo/outbound/SequenceBuilder';
import { SuppressionList } from '@/evo/outbound/SuppressionList';
import { TemplateEditor } from '@/evo/outbound/TemplateEditor';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { WarmupStatus } from '@/evo/outbound/WarmupStatus';
import { hydrateI18n } from '@/lib/i18n';
import { getOutboundLabFixtures } from '../data/outbound';

hydrateI18n('fr', outboundMessages);

const VIEWS = [
    'overview',
    'campaigns',
    'sequences',
    'mailboxes',
    'domains',
    'templates',
    'warmup',
    'outbox',
    'suppressions',
    'reports',
] as const;

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
}

function StateBlock({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
            data-lab-state={id}
        >
            <header className="mb-4">
                <h2 className="text-[14px] font-semibold text-[var(--evo-ink)]">{title}</h2>
                <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">{description}</p>
            </header>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

export function OutboundLabPage({ view = 'overview' }: { view?: string }) {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const data = useMemo(() => getOutboundLabFixtures(), []);
    const [steps, setSteps] = useState<SequenceStepRow[]>(data.steps);
    const activeView = VIEWS.includes(view as (typeof VIEWS)[number]) ? view : 'overview';

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const localeLine = `${data.company.name} · ${formatMoney(1_280_000)} · ${formatPhone(data.karim.phone)} · ${formatTime('2026-10-01T16:30:00+01:00')} · semaine samedi (${WEEK_STARTS_ON})`;

    return (
        <div className="mx-auto max-w-[1120px] pb-16" data-lab-page="outbound">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">Design Lab · PR8</p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">Outbound</h1>
                    <p className="mt-2 max-w-[640px] text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                        Séquence Pharmacie Centrale. Locale fr-DZ, DZD, +213, 24 h, semaine du samedi.
                    </p>
                    <p className="mt-1 text-[12px] tabular-nums text-[var(--evo-ink-muted)]">{localeLine}</p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[12px] font-medium"
                    onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                >
                    {theme === 'dark' ? (
                        <Sun className="size-3.5" weight="regular" />
                    ) : (
                        <Moon className="size-3.5" weight="regular" />
                    )}
                    {theme === 'dark' ? 'Clair' : 'Sombre'}
                </button>
            </header>

            {activeView === 'overview' ? (
                <div className="mt-6">
                    <StateBlock
                        id="overview"
                        title="Vue d’ensemble"
                        description="KPI, santé des boîtes et activité récente."
                    >
                        <Overview
                            stats={data.stats}
                            mailboxHealth={data.mailboxes}
                            recent={data.messages}
                            mailStack={data.mailStack}
                        />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'campaigns' ? (
                <div className="mt-6 grid gap-4">
                    <StateBlock id="campaign-list" title="Campagnes" description="Liste DataGrid 32 px.">
                        <CampaignList campaigns={data.campaigns} />
                    </StateBlock>
                    <StateBlock
                        id="campaign-workspace"
                        title="Espace campagne"
                        description={`${data.campaign.name} — ${data.quote}`}
                    >
                        <CampaignWorkspace campaign={data.campaign} messages={data.messages} />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'sequences' ? (
                <div className="mt-6">
                    <StateBlock
                        id="sequence-builder"
                        title={`Séquence ${data.company.name}`}
                        description="Glisser-déposer clavier, annonces FR."
                    >
                        <SequenceBuilder
                            steps={steps}
                            onReorder={(order) =>
                                setSteps((current) =>
                                    order.map((id, index) => {
                                        const step = current.find((item) => String(item.id) === String(id));

                                        return step ? { ...step, position: index + 1 } : current[index];
                                    }).filter(Boolean) as SequenceStepRow[],
                                )
                            }
                            onRemove={(step) =>
                                setSteps((current) => current.filter((item) => item.id !== step.id))
                            }
                            renderEditor={(step) => (
                                <p className="mt-3 text-[12px] text-[var(--evo-ink-muted)]">
                                    {step.subject ?? step.wa_template_name}
                                </p>
                            )}
                        />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'mailboxes' ? (
                <div className="mt-6">
                    <StateBlock id="mailboxes" title="Boîtes" description="SMTP / IMAP, DataGrid compact.">
                        <MailboxList mailboxes={data.mailboxes} />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'domains' ? (
                <div className="mt-6">
                    <StateBlock id="domains" title="Domaines" description="Checklist SPF / DKIM / DMARC.">
                        <DomainList domains={data.domains} />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'templates' ? (
                <div className="mt-6">
                    <StateBlock id="templates" title="Modèle" description="Éditeur Tiptap MIT + aperçu.">
                        <TemplateEditor
                            template={data.templates[0]}
                            preview={
                                <div className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-3 text-[13px]">
                                    {data.templates[0].body}
                                </div>
                            }
                        />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'warmup' ? (
                <div className="mt-6">
                    <StateBlock id="warmup" title="Warmup" description="Rampe Africa/Algiers.">
                        <WarmupStatus
                            mailboxes={data.warmup}
                            systemMailboxes={[]}
                            ramp={[5, 10, 15, 20, 30, 40]}
                            defaultCeiling={50}
                            summary={{ warming: 1, active: 1, sent_today: 12, cap_today: 20 }}
                        />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'outbox' ? (
                <div className="mt-6">
                    <StateBlock id="outbox" title="Outbox" description="File, différé, envoyé, échec.">
                        <Outbox
                            messages={data.messages}
                            status=""
                            counts={{ queued: 6, deferred: 2, sent: 38, failed: 1 }}
                        />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'suppressions' ? (
                <div className="mt-6">
                    <StateBlock id="suppressions" title="Suppressions" description="E-mail et téléphone +213.">
                        <SuppressionList items={data.suppressions} />
                    </StateBlock>
                </div>
            ) : null}

            {activeView === 'reports' ? (
                <div className="mt-6">
                    <StateBlock id="reports" title="Rapports" description="Recharts encre / teal.">
                        <OutboundReports {...data.reports} />
                    </StateBlock>
                </div>
            ) : null}
        </div>
    );
}
