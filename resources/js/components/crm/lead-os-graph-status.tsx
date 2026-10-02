import { Form, Link } from '@inertiajs/react';
import { t } from '@/lib/i18n';

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
    return t(key.replaceAll('-', ' '));
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
                        {t('Lead OS graph')}
                    </h2>
                    <p className="mt-1 text-[12px] text-mute">
                        {graph
                            ? t('Last :by run · :when · :ok ok · :skipped skipped · :failed failed', {
                                  by: graph.triggered_by,
                                  when: when(graph.started_at),
                                  ok: graph.ok_count,
                                  skipped: graph.skipped_count,
                                  failed: graph.failed_count,
                              })
                            : t('No graph run yet. Run now to drain ads, enrich, score, research, health, and next-move.')}
                    </p>
                </div>
                <Form action="/lead-os/graph" method="post">
                    <button
                        type="submit"
                        className="h-8 rounded-md border border-hairline bg-canvas px-3 text-[12px] text-ink hover:border-brand"
                    >
                        {t('Run now')}
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
                            <span className="tabular-nums">{t(node.status)}</span>
                        </li>
                    ))}
                </ol>
            ) : null}

            {!compact ? (
                <p className="mt-3 text-[11px] text-mute">
                    {t('Nightly at 02:15 Africa/Algiers.')}{' '}
                    <Link href="/reports" className="text-ink hover:underline">
                        {t('Reports')}
                    </Link>
                </p>
            ) : null}
        </section>
    );
}
