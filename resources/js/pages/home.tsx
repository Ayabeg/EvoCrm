import { Head, Link, usePage } from '@inertiajs/react';
import { ActivationChecklist } from '@/components/dashboard/activation-checklist';
import { DashboardAttention } from '@/components/dashboard/dashboard-attention';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardPipeline } from '@/components/dashboard/dashboard-pipeline';
import { DashboardRecent } from '@/components/dashboard/dashboard-recent';
import { DashboardWork } from '@/components/dashboard/dashboard-work';
import { HomeKpiStrip } from '@/components/dashboard/home-kpi-strip';
import { HomeWidget, HomeWidgetEmpty } from '@/components/dashboard/home-widget';
import type { ActivationState } from '@/lib/activation';
import type {
    DashboardAttention as AttentionPayload,
    DashboardContext,
    DashboardMetrics,
    DashboardPipeline as PipelinePayload,
    DashboardRecent as RecentPayload,
    DashboardWork as WorkPayload,
} from '@/lib/dashboard-operating-home';
import { t } from '@/lib/i18n';
import { formatCompactDzd } from '@/lib/money';
import type { Auth } from '@/types';

type Props = {
    context: DashboardContext;
    metrics: DashboardMetrics;
    attention: AttentionPayload;
    work: WorkPayload;
    pipeline: PipelinePayload;
    recent: RecentPayload;
    activation?: ActivationState | null;
};

function ViewAllLink({ href, children }: { href: string; children: string }) {
    return (
        <Link
            href={href}
            className="text-[13px] leading-[18px] text-mute hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
            {children}
        </Link>
    );
}

export default function Home({
    context,
    metrics,
    attention,
    work,
    pipeline,
    recent,
    activation = null,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const canCreate = auth.capabilities.includes('crm.edit');
    const pipelineEmpty = pipeline.deal_count === 0;
    const attentionEmpty = attention.items.length === 0;
    const workEmpty =
        work.counts.overdue === 0 && work.counts.today === 0 && work.counts.upcoming === 0;
    const recentEmpty = recent.items.length === 0;

    return (
        <>
            <Head title={t('Home')} />
            <div className="flex-1 overflow-x-hidden bg-canvas-soft" data-home="workspace">
                <div className="px-4 pt-5 md:px-8">
                    <DashboardHeader context={context} canCreate={canCreate} />
                </div>

                {activation ? <ActivationChecklist activation={activation} /> : null}

                <div className="grid gap-8 px-4 md:px-8 lg:grid-cols-2">
                    <HomeWidget
                        title={t('Needs attention')}
                        action={<ViewAllLink href={attention.view_all_href}>{t('View all')}</ViewAllLink>}
                        empty={attentionEmpty}
                    >
                        <DashboardAttention attention={attention} />
                    </HomeWidget>

                    <HomeWidget
                        title={t('Today')}
                        action={<ViewAllLink href={work.view_all_href}>{t('View all')}</ViewAllLink>}
                        empty={workEmpty}
                    >
                        <DashboardWork work={work} />
                    </HomeWidget>
                </div>

                {metrics.kpis.length > 0 ? (
                    <div className="mt-8">
                        <HomeKpiStrip kpis={metrics.kpis} />
                    </div>
                ) : null}

                <div className="mt-8 px-4 md:px-8">
                    <HomeWidget
                        title={t('Pipeline')}
                        description={
                            pipelineEmpty
                                ? undefined
                                : t(':amount open · :count deals', {
                                      amount: formatCompactDzd(pipeline.amount_cents),
                                      count: pipeline.deal_count,
                                  })
                        }
                        action={<ViewAllLink href={pipeline.view_all_href}>{t('Open board')}</ViewAllLink>}
                        empty={pipelineEmpty}
                    >
                        <DashboardPipeline pipeline={pipeline} />
                    </HomeWidget>
                </div>

                <div className="mt-8 px-4 pb-10 md:px-8">
                    <HomeWidget
                        title={t('Recent records')}
                        action={<ViewAllLink href={recent.view_all_href}>{t('View all')}</ViewAllLink>}
                        empty={recentEmpty}
                    >
                        {recentEmpty ? (
                            <HomeWidgetEmpty
                                title={t('Nothing logged yet')}
                                body={t('Newly logged notes, calls, and tasks appear here.')}
                                action={
                                    canCreate ? (
                                        <Link
                                            href="/crm/contacts?create=1"
                                            className="text-[13px] leading-[18px] text-mute hover:text-ink"
                                        >
                                            {t('Create contact')}
                                        </Link>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <DashboardRecent recent={recent} canCreate={canCreate} />
                        )}
                    </HomeWidget>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
