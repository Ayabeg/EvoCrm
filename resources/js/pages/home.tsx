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
                <div className="px-4 py-3 md:px-5 md:py-4">
                    <DashboardHeader context={context} canCreate={canCreate} />
                </div>

                {activation ? <ActivationChecklist activation={activation} /> : null}

                <div className="grid gap-3 px-4 pb-3 md:px-5 lg:grid-cols-2">
                    <HomeWidget
                        title={t('Needs attention')}
                        description={t('Deal exceptions')}
                        action={
                            <Link
                                href={attention.view_all_href}
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('View all')}
                            </Link>
                        }
                        empty={attentionEmpty}
                    >
                        <DashboardAttention attention={attention} />
                    </HomeWidget>

                    <HomeWidget
                        title={t('Today')}
                        description={t('Your schedule')}
                        action={
                            <Link
                                href={work.view_all_href}
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('View all')}
                            </Link>
                        }
                        empty={workEmpty}
                    >
                        <DashboardWork work={work} />
                    </HomeWidget>
                </div>

                {metrics.kpis.length > 0 ? <HomeKpiStrip kpis={metrics.kpis} /> : null}

                <div className="grid gap-3 px-4 py-3 md:px-5 lg:grid-cols-2">
                    <HomeWidget
                        title={t('Pipeline')}
                        description={
                            pipelineEmpty
                                ? t('Open opportunity value by stage')
                                : t(':amount open · :count deals', {
                                      amount: formatCompactDzd(pipeline.amount_cents),
                                      count: pipeline.deal_count,
                                  })
                        }
                        action={
                            <Link
                                href={pipeline.view_all_href}
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('Open board')}
                            </Link>
                        }
                        empty={pipelineEmpty}
                    >
                        <DashboardPipeline pipeline={pipeline} />
                    </HomeWidget>

                    <HomeWidget
                        title={t('Recent records')}
                        description={t('Recently logged activity')}
                        action={
                            <Link
                                href={recent.view_all_href}
                                className="text-[12px] font-medium text-brand hover:underline"
                            >
                                {t('View all')}
                            </Link>
                        }
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
                                            className="text-[12px] font-medium text-brand hover:underline"
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
