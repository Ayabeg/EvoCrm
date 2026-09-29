import type { ChartConfig } from '@/components/evilcharts/ui/recharts-chart';

export const evoChartConfig = {
    revenue: {
        label: 'CA gagné',
        colors: {
            light: ['#0F4C5C'],
            dark: ['#0F4C5C'],
        },
    },
    pipeline: {
        label: 'Pipeline',
        colors: {
            light: ['#0D1B24'],
            dark: ['#0D1B24'],
        },
    },
    spend: {
        label: 'Dépensé',
        colors: {
            light: ['#0D1B24'],
            dark: ['#0D1B24'],
        },
    },
    leads: {
        label: 'Leads Inbox',
        colors: {
            light: ['#0F4C5C'],
            dark: ['#0F4C5C'],
        },
    },
    value: {
        label: 'Volume',
        colors: {
            light: ['#0D1B24'],
            dark: ['#0D1B24'],
        },
    },
    cumulative: {
        label: 'CA cumulé',
        colors: {
            light: ['#0F4C5C'],
            dark: ['#0F4C5C'],
        },
    },
    won: {
        label: 'CA gagné',
        colors: {
            light: ['#0F4C5C'],
            dark: ['#0F4C5C'],
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
        colors: { light: ['#0F4C5C'], dark: ['#0F4C5C'] },
    },
    'Devis CRM Santé': {
        label: 'Devis CRM Santé',
        colors: { light: ['#0D1B24'], dark: ['#0D1B24'] },
    },
    'Retargeting Devis': {
        label: 'Retargeting Devis',
        colors: { light: ['#5B6B73'], dark: ['#5B6B73'] },
    },
    'Prospecting Oran': {
        label: 'Prospecting Oran',
        colors: { light: ['#8A969C'], dark: ['#8A969C'] },
    },
    'Sources organiques': {
        label: 'Sources organiques',
        colors: { light: ['#1A2C36'], dark: ['#1A2C36'] },
    },
    'Pipeline ouvert': {
        label: 'Pipeline ouvert',
        colors: { light: ['#0D1B24'], dark: ['#0D1B24'] },
    },
    Gagné: {
        label: 'Gagné',
        colors: { light: ['#0F4C5C'], dark: ['#0F4C5C'] },
    },
    Perdu: {
        label: 'Perdu',
        colors: { light: ['#5B6B73'], dark: ['#5B6B73'] },
    },
} satisfies ChartConfig;
