import type { OutboundReportsProps } from '@/evo/outbound/Reports';
import type { EvoVizPayload, ReportWidgetCatalogItem } from '@/evoviz';

export type KpiFormat = 'number' | 'money' | 'percent';

export type ReportKpi = {
    label: string;
    value: number | null;
    format?: KpiFormat;
    hint?: string;
};

export type ReportColumn = {
    key: string;
    label: string;
    format?: KpiFormat | 'text';
    align?: 'left' | 'right';
};

export type ReportTable = {
    columns: ReportColumn[];
    rows: (string | number | null)[][];
};

export type ReportCategory = {
    key: string;
    title: string;
    description?: string;
    kpis: ReportKpi[];
    charts: EvoVizPayload[];
    table: ReportTable | null;
};

export type DashboardOwner = {
    id: number;
    name: string | null;
};

export type DashboardSummary = {
    id: number;
    name: string;
    visibility?: string;
    owner: DashboardOwner;
    widget_count: number;
};

export type DashboardWidget = {
    key: string;
    title: string;
    room: string;
    chart: EvoVizPayload | null;
};

export type OpenDashboard = {
    id: number;
    name: string;
    owner: DashboardOwner;
    widgets: DashboardWidget[];
};

export type ReportWindow = {
    from: string;
    to: string;
    days: number;
    timezone: string;
    custom: boolean;
    owner_id: number | null;
};

export type ReportSchedule = {
    id: number;
    name?: string | null;
    cron: string;
    recipients: string[];
    active: boolean;
    last_status?: string | null;
    last_error?: string | null;
    last_sent_at?: string | null;
};

export type SavedReportRow = {
    id: number;
    name: string;
    entity?: string;
    metric?: string;
    group_by?: string | null;
};

export type ReportResult = {
    metric: string;
    value: number;
    groups?: Array<{ label: string; value: number }>;
};

export type CrossObjectReport = {
    metric: string;
    groups: Array<{ label: string; value: number; count: number }>;
};

export type ReportOwner = { id: number; name: string };

export type { EvoVizPayload, OutboundReportsProps, ReportWidgetCatalogItem };
