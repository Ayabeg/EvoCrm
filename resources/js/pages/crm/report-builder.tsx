import { Form, Head, Link } from '@inertiajs/react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ReportRow = { id: number; name: string; entity: string; metric: string; group_by: string | null };

export default function ReportBuilder({
    reports = [],
    result,
    activeReport,
}: {
    reports?: ReportRow[];
    result?: { metric: string; value: number; groups?: Array<{ label: string; value: number }> };
    activeReport?: ReportRow | null;
}) {
    return (
        <>
            <Head title="Report builder" />
            <div className="mx-auto max-w-4xl space-y-4 p-4">
                <PageHeader title="Report builder" description="Save ad hoc CRM reports with filters and grouping." />
                <Form action="/crm/report-builder" method="post" className="grid gap-2 rounded-lg border border-hairline bg-canvas p-4">
                    <Input name="name" placeholder="Report name" required />
                    <select name="entity" className="h-9 rounded-md border border-hairline bg-background px-2 text-sm" defaultValue="deal">
                        <option value="deal">Deals</option>
                        <option value="contact">Contacts</option>
                    </select>
                    <select name="metric" className="h-9 rounded-md border border-hairline bg-background px-2 text-sm" defaultValue="count">
                        <option value="count">Count</option>
                        <option value="sum_amount">Sum amount</option>
                    </select>
                    <select name="group_by" className="h-9 rounded-md border border-hairline bg-background px-2 text-sm" defaultValue="">
                        <option value="">No grouping</option>
                        <option value="stage">Group by stage</option>
                        <option value="owner">Group by owner</option>
                    </select>
                    <Button type="submit">Save report</Button>
                </Form>
                <div className="space-y-2">
                    {reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between rounded border border-hairline px-3 py-2 text-sm">
                            <span>
                                {report.name} · {report.entity} · {report.metric}
                            </span>
                            <Link href={`/crm/report-builder/${report.id}/run`} className="text-brand underline">
                                Run
                            </Link>
                        </div>
                    ))}
                </div>
                {result && activeReport ? (
                    <div className="rounded-lg border border-hairline bg-canvas-soft p-4 text-sm">
                        <p className="font-semibold">{activeReport.name}</p>
                        <p className="mt-2 tabular-nums">
                            {result.metric}: {result.value}
                        </p>
                        {result.groups?.map((group) => (
                            <p key={group.label} className="text-muted-foreground">
                                {group.label}: {group.value}
                            </p>
                        ))}
                    </div>
                ) : null}
            </div>
        </>
    );
}
