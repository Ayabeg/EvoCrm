import { formatNumber } from '@/evo/lib/format';
import { formatDzd } from '@/lib/money';

import type { KpiFormat } from './types';

export function formatReportValue(value: number | null, format: KpiFormat | 'text' = 'number'): string {
    if (value === null) {
        return '—';
    }

    if (format === 'money') {
        return formatDzd(value);
    }

    if (format === 'percent') {
        return `${formatNumber(value)}\u00A0%`;
    }

    if (format === 'text') {
        return String(value);
    }

    return formatNumber(value);
}
