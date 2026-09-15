import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { BoardOptionsSheet } from '@/components/crm/board-options-sheet';
import type { BoardOptions } from '@/components/crm/board-options-sheet';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import DealForecastBar from '@/components/crm/deal-forecast-bar';
import DealLayoutToggle from '@/components/crm/deal-layout-toggle';
import PipelineSwitcher from '@/components/crm/pipeline-switcher';
import { hasActiveListFilters } from '@/components/crm/list-query';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    dealEmptyState,
    dealRowHref,
} from '@/pages/crm/deals/deal-columns';
import {
    DealPipelineBoard,
    type BoardDeal,
    type BoardStage,
} from '@/pages/crm/deals/deal-pipeline-board';

type PipelineOption = {
    id: number;
    name: string;
    is_default: boolean;
};

type Forecast = {
    count: number;
    amount_cents: number;
    weighted_cents: number;
};

const defaultBoardOptions: BoardOptions = {
    card_style: 'default',
    show_priority: true,
    show_associations: true,
    show_activity: true,
    mark_inactive: true,
    inactive_after_days: 14,
    sort: 'last_activity',
};

export default function DealBoard({
    pipeline,
    pipelines,
    stages,
    deals,
    forecast,
    forecastBand,
    forecastBacktest,
    boardOptions = defaultBoardOptions,
    savedFilters = [],
    activeFilters = {},
    listView,
    members = [],
    recordCount,
    stagePills = [],
    cities = [],
    wilayas = [],
}: {
    pipeline: { id: number; name: string };
    pipelines: PipelineOption[];
    stages: BoardStage[];
    deals: BoardDeal[];
    forecast: Forecast;
    forecastBand?: {
        low_cents: number;
        high_cents: number;
        band_label: string;
        narrative?: string | null;
    } | null;
    forecastBacktest?: {
        status: string;
        label: string;
        sample_count: number;
        error_pct: number | null;
        within_15: boolean;
    } | null;
    boardOptions?: BoardOptions;
    savedFilters?: SavedView[];
    activeFilters?: Record<string, unknown>;
    listView?: ListViewMeta;
    members?: { id: number; name: string }[];
    recordCount?: number;
    stagePills?: StagePill[];
    cities?: string[];
    wilayas?: string[];
}) {
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const loading = useInertiaLoading();
    const exportHref = `/crm/deals/export?pipeline=${pipeline.id}`;
    const filtered = hasActiveListFilters(activeFilters);
    const emptyCopy = deals.length === 0
        ? filtered
            ? t('No deals match these filters')
            : t('No deals in this pipeline')
        : null;

    return (
        <>
            <Head title={t('Deals')} />
            <div
                className="flex h-app-workspace min-h-0 flex-col overflow-x-hidden bg-canvas-soft"
                data-crm="deals-board"
            >
                <CrmListShell
                    resultMode="shared-table"
                    mode="board"
                    title="Deals"
                    entity="deal"
                    basePath="/crm/deals/board"
                    primaryLabel="Create deal"
                    onCreate={() => setDrawer(true)}
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount ?? forecast.count}
                    members={members}
                    cities={cities}
                    wilayas={wilayas}
                    stages={stages}
                    stagePills={stagePills}
                    exportHref={exportHref}
                    className="bg-canvas-soft"
                    contentClassName="min-h-0 overflow-x-hidden overflow-y-hidden bg-canvas-soft"
                    rows={deals}
                    rowHref={dealRowHref}
                    empty={dealEmptyState(filtered)}
                    loading={loading}
                    selection={{
                        mode: 'uncontrolled',
                        selectable: false,
                        pageIds: deals.map((deal) => deal.id),
                    }}
                    headerActions={
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="h-8">
                                    {t('Board options')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setOptionsOpen(true)}>
                                    {t('Edit cards')}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings/pipelines">{t('Edit stages')}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={exportHref}>{t('Export view')}</a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    }
                    layoutToggle={
                        <DealLayoutToggle
                            current="board"
                            pipelineId={pipeline.id}
                            activeFilters={activeFilters}
                            extraQuery={{ pipeline: pipeline.id }}
                        />
                    }
                    pipelineSwitcher={
                        <PipelineSwitcher
                            pipelineId={pipeline.id}
                            pipelines={pipelines}
                            basePath="/crm/deals/board"
                            activeFilters={activeFilters}
                            extraQuery={{ pipeline: pipeline.id }}
                        />
                    }
                    extraQuery={{ pipeline: pipeline.id }}
                    banner={
                        <>
                            <DealForecastBar
                                forecast={forecast}
                                forecastBand={forecastBand}
                                forecastBacktest={forecastBacktest}
                            />
                            {emptyCopy ? (
                                <p
                                    className="border-b border-hairline bg-white px-4 py-2 text-[12px] text-mute md:px-8"
                                    data-crm="pipeline-empty"
                                    role="status"
                                >
                                    {emptyCopy}
                                </p>
                            ) : null}
                        </>
                    }
                    board={
                        <DealPipelineBoard
                            stages={stages}
                            deals={deals}
                            options={boardOptions}
                            loading={loading}
                        />
                    }
                />
            </div>
            <BoardOptionsSheet
                open={optionsOpen}
                onOpenChange={setOptionsOpen}
                options={boardOptions}
                exportHref={exportHref}
            />
            <CreateDrawer open={drawer} onOpenChange={setDrawer} title="Create deal">
                <Form
                    action="/crm/deals"
                    method="post"
                    className="space-y-3"
                    resetOnSuccess
                    onSuccess={() => setDrawer(false)}
                >
                    {({ processing }) => (
                        <>
                            <div>
                                <Label className="mb-1 block text-[12px]">
                                    {t('Deal name')} <span className="text-brand">*</span>
                                </Label>
                                <Input name="title" required />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Amount (DZD)')}</Label>
                                <Input name="amount_dzd" type="number" min="0" step="0.01" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Close date')}</Label>
                                <Input name="close_date" type="date" />
                            </div>
                            <div>
                                <Label className="mb-1 block text-[12px]">{t('Stage')}</Label>
                                <select
                                    name="stage_id"
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input type="hidden" name="pipeline_id" value={pipeline.id} />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>
                                    {t('Cancel')}
                                </Button>
                                <Button disabled={processing}>{t('Create')}</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </>
    );
}

DealBoard.layout = {
    breadcrumbs: [
        { title: 'Deals', href: '/crm/deals' },
        { title: 'Pipeline', href: '/crm/deals/board' },
    ],
};
