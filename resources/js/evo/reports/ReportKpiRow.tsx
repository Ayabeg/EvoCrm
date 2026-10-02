import type { KpiTile } from '@/components/crm/crm-kpi-strip';
import { CrmKpiStrip } from '@/evo/patterns/kpi';

import type { ReportKpi } from './types';

export function ReportKpiRow({ kpis, columns = 6 }: { kpis: ReportKpi[]; columns?: 4 | 5 | 6 }) {
    const tiles: KpiTile[] = kpis.map((kpi, index) => ({
        key: `${kpi.label}-${index}`,
        label: kpi.label,
        value: kpi.value,
        format: kpi.format,
        hint: kpi.hint,
    }));

    return <CrmKpiStrip kpis={tiles} columns={columns} />;
}
