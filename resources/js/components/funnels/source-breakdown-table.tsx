import { formatDzd } from '@/components/crm/hub-chrome';

export type SourceBreakdownRow = {
    source: string;
    visits: number;
    orders_placed: number;
    confirmed: number;
    delivered: number;
    spend_cents: number;
    cpl_cents: number | null;
};

function labelSource(source: string): string {
    const map: Record<string, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        google: 'Google',
        direct: 'Direct',
    };

    return map[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

export function SourceBreakdownTable({ rows }: { rows: SourceBreakdownRow[] }) {
    if (rows.length === 0) {
        return (
            <p className="px-4 py-6 text-[13px] text-muted-foreground">
                No source data in this window yet.
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
            <table className="w-full text-[13px]">
                <thead className="bg-canvas-soft text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                    <tr>
                        <th className="px-3 py-2 font-medium">Source</th>
                        <th className="px-3 py-2 text-right font-medium">Visits</th>
                        <th className="px-3 py-2 text-right font-medium">Orders</th>
                        <th className="px-3 py-2 text-right font-medium">Confirmed</th>
                        <th className="px-3 py-2 text-right font-medium">Delivered</th>
                        <th className="px-3 py-2 text-right font-medium">Spend</th>
                        <th className="px-3 py-2 text-right font-medium">CPL</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.source} className="border-t border-hairline">
                            <td className="px-3 py-2 font-medium text-ink">
                                {labelSource(row.source)}
                            </td>
                            <td className="money px-3 py-2 text-right">
                                {row.visits.toLocaleString()}
                            </td>
                            <td className="money px-3 py-2 text-right">
                                {row.orders_placed.toLocaleString()}
                            </td>
                            <td className="money px-3 py-2 text-right">
                                {row.confirmed.toLocaleString()}
                            </td>
                            <td className="money px-3 py-2 text-right">
                                {row.delivered.toLocaleString()}
                            </td>
                            <td className="money px-3 py-2 text-right">
                                {formatDzd(row.spend_cents)}
                            </td>
                            <td className="money px-3 py-2 text-right text-muted-foreground">
                                {row.cpl_cents !== null
                                    ? formatDzd(row.cpl_cents)
                                    : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
