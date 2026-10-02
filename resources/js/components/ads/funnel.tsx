export type FunnelCounts = {
    impressions: number;
    clicks: number;
    reach?: number;
    spend_cents: number;
    conversations: number;
    form_leads: number;
    qualified: number;
    deals: number;
    won: number;
    revenue_cents?: number;
    ctr?: number | null;
    cpc_cents?: number | null;
    cpm_cents?: number | null;
    cpl_cents?: number | null;
    cpql_cents?: number | null;
    cac_cents?: number | null;
    roas?: number | null;
    revenue_per_lead_cents?: number | null;
};

export const EMPTY_FUNNEL: FunnelCounts = {
    impressions: 0,
    clicks: 0,
    reach: 0,
    spend_cents: 0,
    conversations: 0,
    form_leads: 0,
    qualified: 0,
    deals: 0,
    won: 0,
    revenue_cents: 0,
    ctr: null,
    cpc_cents: null,
    cpm_cents: null,
    cpl_cents: null,
    cpql_cents: null,
    cac_cents: null,
    roas: null,
    revenue_per_lead_cents: null,
};

type Stage = {
    label: string;
    count: number;
    hint?: string;
};

function stagesOf(funnel: FunnelCounts): Stage[] {
    return [
        { label: 'Impressions', count: funnel.impressions },
        { label: 'Clicks', count: funnel.clicks },
        {
            label: 'Conversations / Leads',
            count: funnel.conversations + funnel.form_leads,
            hint: `${funnel.conversations} CTWA · ${funnel.form_leads} form`,
        },
        { label: 'Qualified', count: funnel.qualified },
        { label: 'Deals', count: funnel.deals },
        { label: 'Won', count: funnel.won },
    ];
}

function pct(part: number, whole: number): string {
    if (whole <= 0) {
        return '—';
    }

    return `${Math.round((part / whole) * 100)}%`;
}

/**
 * Impressions → Clicks → Conversations/Leads → Qualified → Deals → Won.
 * Bar widths are relative to the campaign's own impressions; orange is the
 * only action color, so stage depth reads through opacity.
 */
export function FunnelBoard({ funnel, compact = false }: { funnel: FunnelCounts; compact?: boolean }) {
    const stages = stagesOf(funnel);
    const top = Math.max(funnel.impressions, 1);

    return (
        <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
            {stages.map((stage, index) => {
                const width = stage.count > 0 ? Math.max((stage.count / top) * 100, 3) : 0;
                const previous = index > 0 ? stages[index - 1].count : null;

                return (
                    <div key={stage.label} className="grid grid-cols-[9rem_minmax(0,1fr)_auto] items-center gap-2">
                        <div className="truncate text-[11px] text-muted-foreground" title={stage.hint}>
                            {stage.label}
                        </div>
                        <div className="h-4 rounded-sm bg-canvas-soft">
                            {stage.count > 0 ? (
                                <div
                                    className="h-4 rounded-sm bg-brand"
                                    style={{ width: `${Math.min(width, 100)}%`, opacity: 1 - index * 0.13 }}
                                />
                            ) : null}
                        </div>
                        <div className="text-end text-[11px] whitespace-nowrap">
                            <span className="font-medium text-ink">{stage.count.toLocaleString()}</span>{' '}
                            <span className="text-muted-foreground">
                                {previous === null ? '' : pct(stage.count, previous)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
