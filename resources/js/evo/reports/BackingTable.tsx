import { formatReportValue } from '@/evo/reports/format';
import type { ReportTable } from '@/evo/reports/types';
import { t } from '@/lib/i18n';

export function BackingTable({ table }: { table: ReportTable }) {
    if (table.rows.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto border-t border-[var(--evo-hairline)]">
            <table className="w-full">
                <thead className="bg-[var(--evo-surface-subtle)] text-start text-[11px] text-[var(--evo-ink-muted)]">
                    <tr>
                        {table.columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-4 py-2.5 font-medium ${column.align === 'right' ? 'text-end' : ''}`}
                            >
                                {t(column.label)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, i) => (
                        <tr key={i} className="border-t border-[var(--evo-hairline)]">
                            {row.map((cell, j) => {
                                const column = table.columns[j];
                                const right = column?.align === 'right';

                                return (
                                    <td
                                        key={column?.key ?? j}
                                        className={`px-4 py-2.5 text-[13px] ${right ? 'text-end tabular-nums' : ''} ${cell === null || cell === 0 ? 'text-[var(--evo-ink-muted)]' : 'text-[var(--evo-ink)]'}`}
                                    >
                                        {typeof cell === 'number'
                                            ? formatReportValue(
                                                  cell,
                                                  column?.format === 'text' ? 'number' : column?.format,
                                              )
                                            : (cell ?? '—')}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
