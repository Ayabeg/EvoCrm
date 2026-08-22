import { Head } from '@inertiajs/react';
import { formatDzd } from '@/components/crm/hub-chrome';

export default function Reports({
    wonThisMonth,
    lostThisMonth,
    pipelineByStage,
    activitiesCompleted,
    openPipelineCents,
}: any) {
    return (
        <>
            <Head title="Reports" />
            <div className="flex-1 space-y-4 bg-[#f6f4ef] p-6 text-[13px] dark:bg-slate-950">
                <h1 className="text-lg font-semibold">Sales reports</h1>
                <p className="text-muted-foreground">Light operational view — not a BI tool. Currency DZD. Africa/Algiers month.</p>
                <div className="grid gap-3 md:grid-cols-4">
                    {[
                        ['Won this month', `${wonThisMonth.count} · ${formatDzd(wonThisMonth.amount_cents)}`],
                        ['Lost this month', `${lostThisMonth.count} · ${formatDzd(lostThisMonth.amount_cents)}`],
                        ['Open pipeline', formatDzd(openPipelineCents)],
                        ['Activities completed', String(activitiesCompleted)],
                    ].map(([label, value]) => (
                        <div key={label} className="border bg-white p-3 dark:bg-slate-900">
                            <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
                            <p className="mt-1 text-base font-semibold">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="border bg-white dark:bg-slate-900">
                    <table className="w-full">
                        <thead className="bg-[#faf8f4] text-left text-[11px] uppercase text-muted-foreground dark:bg-slate-800">
                            <tr>
                                <th className="px-3 py-2">Stage</th>
                                <th className="px-3 py-2">Deals</th>
                                <th className="px-3 py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(pipelineByStage ?? {}).map(([stage, row]: any) => (
                                <tr key={stage} className="border-t">
                                    <td className="px-3 py-2">{stage}</td>
                                    <td className="px-3 py-2">{row.count}</td>
                                    <td className="px-3 py-2">{formatDzd(row.amount_cents)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/crm/reports' }],
};
