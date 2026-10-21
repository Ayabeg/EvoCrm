import { Form } from '@inertiajs/react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { RecordSection } from '@/components/crm/record-hub';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export type EnrichmentRunRow = {
    id: number;
    source: string;
    field: string;
    value?: string | null;
    confidence: number;
    status: string;
    verification_status?: string;
    evidence_url?: string | null;
    retrieved_at?: string | null;
    error?: string | null;
    created_at?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
    website: 'Website',
    google_places: 'Google Places',
    apollo: 'Apollo',
    clay: 'Clay',
};

function sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
}

function confidenceLabel(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function badgeVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'applied') {
        return 'default';
    }

    if (status === 'failed') {
        return 'destructive';
    }

    if (status === 'proposed') {
        return 'secondary';
    }

    return 'outline';
}

export default function EnrichmentPanel({
    action,
    runs = [],
}: {
    action: string;
    runs?: EnrichmentRunRow[];
}) {
    return (
        <RecordSection
            title={t('Enrichment')}
            action={
                <Form
                    action={action}
                    method="post"
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={processing}
                            className="h-7 gap-1.5"
                        >
                            <MagnifyingGlass className="size-3.5" aria-hidden />
                            {t('Enrich')}
                        </Button>
                    )}
                </Form>
            }
        >
            {runs.length === 0 ? (
                <p className="text-mute">
                    {t(
                        'No enrichment runs yet. Enrich pulls the public website and Google Places. It never invents an email or WhatsApp number.',
                    )}
                </p>
            ) : (
                <ul className="space-y-3">
                    {runs.map((run) => (
                        <li
                            key={run.id}
                            className="border-t border-hairline pt-3 first:border-t-0 first:pt-0"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] font-medium text-ink">
                                    {run.field}
                                </p>
                                <Badge variant={badgeVariant(run.status)}>
                                    {run.status}
                                </Badge>
                                <span className="text-[11px] text-mute">
                                    {sourceLabel(run.source)} ·{' '}
                                    {confidenceLabel(run.confidence)}
                                </span>
                                {run.verification_status ? (
                                    <span className="text-[11px] text-mute">
                                        · {run.verification_status.replaceAll('_', ' ')}
                                    </span>
                                ) : null}
                            </div>
                            {run.value ? (
                                <p className="mt-1 break-words text-[13px] text-ink">
                                    {run.value}
                                </p>
                            ) : null}
                            {run.error ? (
                                <p className="mt-1 text-[12px] text-mute">
                                    {run.error}
                                </p>
                            ) : null}
                            {run.evidence_url ? (
                                <a
                                    href={run.evidence_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex text-[12px] text-ink underline-offset-2 hover:underline"
                                >
                                    Evidence
                                </a>
                            ) : null}
                            {run.status === 'failed' ? (
                                <div className="mt-2">
                                    <Form
                                        action={`/crm/enrichment-runs/${run.id}/retry`}
                                        method="post"
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="outline"
                                                className="h-7"
                                                disabled={processing}
                                            >
                                                Retry
                                            </Button>
                                        )}
                                    </Form>
                                </div>
                            ) : null}
                            {run.status === 'proposed' ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Form
                                        action={`/crm/enrichment-runs/${run.id}/apply`}
                                        method="post"
                                        options={{ preserveScroll: true }}
                                    >
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="h-7"
                                        >
                                            Apply
                                        </Button>
                                    </Form>
                                    <Form
                                        action={`/crm/enrichment-runs/${run.id}/dismiss`}
                                        method="post"
                                        options={{ preserveScroll: true }}
                                    >
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="outline"
                                            className="h-7"
                                        >
                                            Dismiss
                                        </Button>
                                    </Form>
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </RecordSection>
    );
}
