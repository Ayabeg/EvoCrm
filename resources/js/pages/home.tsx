import type { ReactNode } from 'react';
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
import { cn } from '@/lib/utils';
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

function HomeModule({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn('home-module', className)}>{children}</div>;
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
                <div className="mx-auto w-full max-w-[72rem] px-4 pt-6 md:px-8">
                    <DashboardHeader context={context} canCreate={canCreate} />

                    {activation ? <ActivationChecklist activation={activation} /> : null}

                    <HomeModule>
                        <div className="grid lg:grid-cols-2">
                            <HomeWidget
                                title={t('Needs attention')}
                                className="px-5 py-5 md:px-6 md:py-6"
                                action={
                                    <ViewAllLink href={attention.view_all_href}>
                                        {t('View all')}
                                    </ViewAllLink>
                                }
                                empty={attentionEmpty}
                            >
                                <DashboardAttention attention={attention} />
                            </HomeWidget>

                            <HomeWidget
                                title={t('Today')}
                                className="border-t border-hairline px-5 py-5 md:px-6 md:py-6 lg:border-t-0 lg:border-l lg:border-hairline lg:pl-8"
                                action={
                                    <ViewAllLink href={work.view_all_href}>{t('View all')}</ViewAllLink>
                                }
                                empty={workEmpty}
                            >
                                <DashboardWork work={work} />
                            </HomeWidget>
                        </div>
                    </HomeModule>

                    {metrics.kpis.length > 0 ? (
                        <HomeModule className="mt-6 px-5 py-5 md:px-6 md:py-6">
                            <HomeKpiStrip kpis={metrics.kpis} windowLabel={metrics.window.label} />
                        </HomeModule>
                    ) : null}

                    <HomeModule className="mt-6 px-5 py-5 md:px-6 md:py-6">
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
                            action={
                                <ViewAllLink href={pipeline.view_all_href}>{t('Open board')}</ViewAllLink>
                            }
                            empty={pipelineEmpty}
                        >
                            <DashboardPipeline pipeline={pipeline} />
                        </HomeWidget>
                    </HomeModule>

                    <HomeModule className="mt-6 mb-10 px-5 py-5 md:px-6 md:py-6">
                        <HomeWidget
                            title={t('Recent records')}
                            action={
                                <ViewAllLink href={recent.view_all_href}>{t('View all')}</ViewAllLink>
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
                    </HomeModule>
                </div>
            </div>
        </>
    );
}

Home.layout = {
    breadcrumbs: [{ title: 'Home', href: '/dashboard' }],
};
