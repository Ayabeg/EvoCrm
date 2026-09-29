import { Head, Link, usePage } from '@inertiajs/react';
import { ActivationChecklist } from '@/components/dashboard/activation-checklist';
import { DashboardPipeline } from '@/components/dashboard/dashboard-pipeline';
import { HomeKpiStrip } from '@/components/dashboard/home-kpi-strip';
import { HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { ActivationState } from '@/lib/activation';
import type {
    DashboardMetrics,
    DashboardPipeline as PipelinePayload,
    DashboardRecentDeal,
    DashboardContext,
} from '@/lib/dashboard-operating-home';
import { DASHBOARD_TIMEZONE } from '@/lib/dashboard-operating-home';
import { dateLocale, t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';
import type { Auth } from '@/types';

type Props = {
    context: DashboardContext;
    metrics: DashboardMetrics;
    pipeline: PipelinePayload;
    recentDeals?: DashboardRecentDeal[];
    activation?: ActivationState | null;
};

const STAGE_COLORS = ['#E8530E', '#ff7a3d', '#ffc6a8', '#d6d7d9', '#afb1b5', '#9aa0ab'];

function formatCreated(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(dateLocale(), {
            timeZone: DASHBOARD_TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

function donutBackground(pipeline: PipelinePayload): string {
    const total = pipeline.amount_cents;

    if (total <= 0) {
        return '#ededeb';
    }

    let cursor = 0;
    const stops = pipeline.stages.map((stage, index) => {
        const share = (stage.amount_cents / total) * 100;
        const start = cursor;
        cursor += share;

        return `${STAGE_COLORS[index % STAGE_COLORS.length]} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
}

export default function Home({
    context,
    metrics,
    pipeline,
    recentDeals = [],
    activation = null,
}: Props) {
    const page = usePage<{ auth: Auth; workspace: { name: string } | null }>();
    const canCreate = page.props.auth.capabilities.includes('crm.edit');
    const greetingName = page.props.workspace?.name || context.name;
    const trend = metrics.trend ?? [];
    const peak = Math.max(
        1,
        ...trend.flatMap((point) => [point.won_cents, point.created_cents]),
    );
    const pipelineEmpty = pipeline.deal_count === 0;

    return (
        <>
            <Head title={t('Home')} />
            <div className="flex-1 overflow-x-hidden bg-[var(--home-canvas)]" data-home="workspace">
                <div className="mx-auto w-full max-w-[1510px] px-4 pt-[18px] pb-8 md:px-[22px]">
                    <header className="mb-[15px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="m-0 text-[27px] leading-none font-semibold tracking-[-0.7px] text-[var(--home-ink)]">
                                {t('Hello :name', { name: greetingName })}
                            </h1>
                            <p className="mt-1.5 text-[12px] text-[var(--home-muted)]">
                                {context.date} · {context.timezone}
                            </p>
                        </div>
                        {canCreate ? (
                            <Link
                                href="/crm/deals?create=1"
                                className="inline-flex h-[39px] shrink-0 items-center rounded-lg bg-[var(--home-accent)] px-[18px] text-[12px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:outline-none"
                            >
                                {t('New deal')}
                            </Link>
                        ) : null}
                    </header>

                    {activation ? <ActivationChecklist activation={activation} /> : null}

                    {metrics.kpis.length > 0 ? (
                        <div className="mb-3.5">
                            <HomeKpiStrip kpis={metrics.kpis} />
                        </div>
                    ) : null}

                    <section className="mb-3.5 grid gap-3.5 xl:grid-cols-[1.38fr_1fr]">
                        <article className="home-module px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="m-0 text-[16px] font-semibold text-[var(--home-ink)]">
                                        {t('Deal evolution')}
                                    </h2>
                                    <p className="mt-1 text-[11px] text-[var(--home-muted)]">
                                        {t('Deal value (DZD)')}
                                    </p>
                                </div>
                                <span className="inline-flex h-8 items-center rounded-[7px] border border-[var(--home-line)] bg-[var(--home-paper)] px-2.5 text-[11px] text-[var(--home-ink)]">
                                    {t('Last 6 months')}
                                </span>
                            </div>
                            <div
                                className="mt-3 flex h-[168px] items-end gap-2"
                                role="img"
                                aria-label={t('Deal evolution')}
                            >
                                {trend.map((point) => (
                                    <div
                                        key={point.label}
                                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                                    >
                                        <div className="flex h-[132px] items-end gap-1">
                                            <span
                                                className="w-[18px] rounded-t-[3px] bg-[var(--home-accent)]"
                                                style={{
                                                    height: `${Math.round((point.won_cents / peak) * 132)}px`,
                                                }}
                                                title={`${t('Won deals')} ${formatCompactDzd(point.won_cents)}`}
                                            />
                                            <span
                                                className="w-[18px] rounded-t-[3px] bg-[var(--home-bar)]"
                                                style={{
                                                    height: `${Math.round((point.created_cents / peak) * 132)}px`,
                                                }}
                                                title={`${t('Created value')} ${formatCompactDzd(point.created_cents)}`}
                                            />
                                        </div>
                                        <span className="mt-1.5 text-[10px] text-[var(--home-muted)]">
                                            {point.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 flex justify-center gap-4 text-[10px] text-[var(--home-muted)]">
                                <span className="inline-flex items-center gap-1.5">
                                    <i className="size-2 rounded-full bg-[var(--home-accent)]" />
                                    {t('Won deals')}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <i className="size-2 rounded-full bg-[var(--home-bar)]" />
                                    {t('Created value')}
                                </span>
                            </p>
                        </article>

                        <article className="home-module px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="m-0 text-[16px] font-semibold text-[var(--home-ink)]">
                                        {t('Pipeline split')}
                                    </h2>
                                    <p className="mt-1 text-[11px] text-[var(--home-muted)]">
                                        {pipelineEmpty
                                            ? t('No open deals')
                                            : t(':amount open · :count deals', {
                                                  amount: formatCompactDzd(pipeline.amount_cents),
                                                  count: pipeline.deal_count,
                                              })}
                                    </p>
                                </div>
                                <span className="inline-flex h-8 items-center rounded-[7px] border border-[var(--home-line)] bg-[var(--home-paper)] px-2.5 text-[11px]">
                                    {t('By stage')}
                                </span>
                            </div>
                            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                                <div className="relative grid size-[145px] shrink-0 place-items-center">
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{ background: donutBackground(pipeline) }}
                                    />
                                    <div className="absolute inset-[34px] rounded-full bg-[var(--home-paper)]" />
                                    <div className="relative text-center">
                                        <p className="text-[18px] leading-none font-semibold tracking-tight">
                                            {formatCompactDzd(pipeline.amount_cents).replace(' DZD', '')}
                                        </p>
                                        <p className="mt-1 text-[10px] text-[var(--home-muted)]">DZD</p>
                                    </div>
                                </div>
                                <ul className="w-full min-w-0 flex-1">
                                    {pipeline.stages.map((stage, index) => {
                                        const share =
                                            pipeline.amount_cents > 0
                                                ? Math.round(
                                                      (stage.amount_cents / pipeline.amount_cents) * 100,
                                                  )
                                                : 0;

                                        return (
                                            <li
                                                key={stage.id}
                                                className="flex items-center gap-2.5 border-b border-[var(--home-line-soft)] py-2.5 text-[11px] last:border-0"
                                            >
                                                <i
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        background:
                                                            STAGE_COLORS[index % STAGE_COLORS.length],
                                                    }}
                                                />
                                                <span className="font-semibold">{stage.name}</span>
                                                <span className="ml-auto text-[var(--home-muted)]">
                                                    {formatCompactDzd(stage.amount_cents)} ({share}%)
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </article>
                    </section>

                    <section className="grid gap-3.5 xl:grid-cols-[1.38fr_1fr]">
                        <article className="home-module px-5 py-4">
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="m-0 text-[16px] font-semibold">{t('Recent deals')}</h2>
                                <Link
                                    href="/crm/deals"
                                    className="text-[11px] text-[var(--home-muted)] hover:text-[var(--home-ink)]"
                                >
                                    {t('View all')}
                                </Link>
                            </div>
                            {recentDeals.length === 0 ? (
                                <HomeWidgetEmpty
                                    title={t('Nothing logged yet')}
                                    body={t('Newly logged notes, calls, and tasks appear here.')}
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="grid min-w-[520px] grid-cols-[1.35fr_0.75fr_0.6fr_0.7fr_0.9fr] border-b border-[var(--home-line)] text-[10px] text-[var(--home-muted)]">
                                        <span className="py-2">{t('Deal name')}</span>
                                        <span className="py-2">{t('Company')}</span>
                                        <span className="py-2">{t('Value')}</span>
                                        <span className="py-2">{t('Stage')}</span>
                                        <span className="py-2">{t('Create date')}</span>
                                    </div>
                                    {recentDeals.map((deal) => (
                                        <Link
                                            key={deal.id}
                                            href={deal.href}
                                            className="grid min-w-[520px] grid-cols-[1.35fr_0.75fr_0.6fr_0.7fr_0.9fr] items-center border-b border-[var(--home-line-soft)] py-2 text-[11px] text-[var(--home-ink)] last:border-0 hover:bg-[var(--home-wash)]"
                                        >
                                            <span className="truncate pr-2 font-semibold">{deal.title}</span>
                                            <span className="truncate pr-2 text-[var(--home-muted)]">
                                                {deal.company ?? '—'}
                                            </span>
                                            <span>{formatCompactDzd(deal.amount_cents)}</span>
                                            <span>
                                                <span className="inline-flex rounded-full bg-[var(--home-chip)] px-2 py-0.5 text-[10px] font-semibold">
                                                    {deal.stage ?? '—'}
                                                </span>
                                            </span>
                                            <span className="text-[var(--home-muted)]">
                                                {formatCreated(deal.created_at)}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </article>

                        <article className="home-module px-5 py-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="m-0 text-[16px] font-semibold">{t('Pipeline')}</h2>
                                    <p className="mt-1 text-[11px] text-[var(--home-muted)]">
                                        {pipelineEmpty
                                            ? t('No open deals')
                                            : t(':amount open · :count deals', {
                                                  amount: formatCompactDzd(pipeline.amount_cents),
                                                  count: pipeline.deal_count,
                                              })}
                                    </p>
                                </div>
                                <Link
                                    href={pipeline.view_all_href}
                                    className="text-[11px] text-[var(--home-muted)] hover:text-[var(--home-ink)]"
                                >
                                    {t('Open board')}
                                </Link>
                            </div>
                            <DashboardPipeline pipeline={pipeline} />
                        </article>
                    </section>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
