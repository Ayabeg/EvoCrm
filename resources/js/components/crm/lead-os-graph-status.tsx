import { Form, Link } from '@inertiajs/react';

export type GraphNodeStatus = {
    key: string;
    status: string;
    counts?: Record<string, number>;
    error?: string | null;
};

export type LeadOsGraphPayload = {
    id: number;
    triggered_by: string;
    status: string;
    started_at?: string | null;
    finished_at?: string | null;
    ok_count: number;
    skipped_count: number;
    failed_count: number;
    error?: string | null;
    nodes: GraphNodeStatus[];
};

function nodeLabel(key: string): string {
    return key.replaceAll('-', ' ');
}

function when(iso?: string | null): string {
    if (!iso) {
        return '—';
    }

    return iso.replace('T', ' ').slice(0, 16);
}

export default function LeadOsGraphStatus({
    graph,
    compact = false,
}: {
    graph?: LeadOsGraphPayload | null;
    compact?: boolean;
}) {
    return (
        <section
            data-testid="lead-os-graph"
            className={compact ? 'py-1' : 'border-t border-hairline bg-canvas py-1'}
        >
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                        Lead OS graph
                    </h2>
                    <p className="mt-1 text-[12px] text-mute">
                        {graph
                            ? `Last ${graph.triggered_by} run · ${when(graph.started_at)} · ${graph.ok_count} ok · ${graph.skipped_count} skipped · ${graph.failed_count} failed`
                            : 'No nightly run yet. Capture-drain, enrich, and score skip until those commands land.'}
                    </p>
                </div>
                <Form action="/lead-os/graph" method="post">
                    <button
                        type="submit"
                        className="h-8 rounded-md border border-hairline bg-canvas px-3 text-[12px] text-ink hover:border-brand"
                    >
                        Run now
                    </button>
                </Form>
            </header>

            {graph ? (
                <ol className="mt-3 flex flex-wrap gap-1.5">
                    {graph.nodes.map((node) => (
                        <li
                            key={node.key}
                            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-2 py-0.5 text-[11px] text-ink"
                        >
                            <span>{nodeLabel(node.key)}</span>
                            <span className="tabular-nums">{node.status}</span>
                        </li>
                    ))}
                </ol>
            ) : null}

            {!compact ? (
                <p className="mt-3 text-[11px] text-mute">
                    Nightly at 02:15 Africa/Algiers.{' '}
                    <Link href="/reports" className="text-ink hover:underline">
                        Reports
                    </Link>
                </p>
            ) : null}
        </section>
    );
}
