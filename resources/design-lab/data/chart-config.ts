import type { ChartConfig } from '@/components/evilcharts/ui/recharts-chart';

export const evoChartConfig = {
    revenue: {
        label: 'CA gagné',
        colors: {
            light: ['var(--evo-teal)'],
            dark: ['var(--evo-teal)'],
        },
    },
    pipeline: {
        label: 'Pipeline',
        colors: {
            light: ['var(--evo-ink)'],
            dark: ['var(--evo-ink)'],
        },
    },
    spend: {
        label: 'Dépensé',
        colors: {
            light: ['var(--evo-ink)'],
            dark: ['var(--evo-ink)'],
        },
    },
    leads: {
        label: 'Leads Inbox',
        colors: {
            light: ['var(--evo-teal)'],
            dark: ['var(--evo-teal)'],
        },
    },
    value: {
        label: 'Volume',
        colors: {
            light: ['var(--evo-ink)'],
            dark: ['var(--evo-ink)'],
        },
    },
    cumulative: {
        label: 'CA cumulé',
        colors: {
            light: ['var(--evo-teal)'],
            dark: ['var(--evo-teal)'],
        },
    },
    won: {
        label: 'CA gagné',
        colors: {
            light: ['var(--evo-teal)'],
            dark: ['var(--evo-teal)'],
        },
    },
} satisfies ChartConfig;

export const pipelineChartConfig = {
    pipeline: evoChartConfig.pipeline,
} satisfies ChartConfig;

export const cumulativeChartConfig = {
    cumulative: evoChartConfig.cumulative,
} satisfies ChartConfig;

export const leadsChartConfig = {
    leads: evoChartConfig.leads,
} satisfies ChartConfig;

export const spendLeadsChartConfig = {
    spend: evoChartConfig.spend,
    leads: evoChartConfig.leads,
} satisfies ChartConfig;

export const valueChartConfig = {
    value: evoChartConfig.value,
} satisfies ChartConfig;

export const spendChartConfig = {
    spend: evoChartConfig.spend,
} satisfies ChartConfig;

export const campaignCompareChartConfig = {
    spend: evoChartConfig.spend,
    pipeline: evoChartConfig.pipeline,
} satisfies ChartConfig;

export const sankeyChartConfig = {
    'WA Cliniques Alger': {
        label: 'WA Cliniques Alger',
        colors: { light: ['var(--evo-teal)'], dark: ['var(--evo-teal)'] },
    },
    'Devis CRM Santé': {
        label: 'Devis CRM Santé',
        colors: { light: ['var(--evo-ink)'], dark: ['var(--evo-ink)'] },
    },
    'Retargeting Devis': {
        label: 'Retargeting Devis',
        colors: { light: ['var(--evo-ink-muted)'], dark: ['var(--evo-ink-muted)'] },
    },
    'Prospecting Oran': {
        label: 'Prospecting Oran',
        colors: { light: ['var(--evo-ink-muted)'], dark: ['var(--evo-ink-muted)'] },
    },
    'Sources organiques': {
        label: 'Sources organiques',
        colors: { light: ['var(--evo-ink)'], dark: ['var(--evo-ink)'] },
    },
    'Pipeline ouvert': {
        label: 'Pipeline ouvert',
        colors: { light: ['var(--evo-ink)'], dark: ['var(--evo-ink)'] },
    },
    Gagné: {
        label: 'Gagné',
        colors: { light: ['var(--evo-teal)'], dark: ['var(--evo-teal)'] },
    },
    Perdu: {
        label: 'Perdu',
        colors: { light: ['var(--evo-ink-muted)'], dark: ['var(--evo-ink-muted)'] },
    },
} satisfies ChartConfig;
