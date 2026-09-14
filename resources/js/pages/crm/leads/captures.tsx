import { Form, Link, router } from '@inertiajs/react';
import { Plus, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import {
    CrmObjectHeader,
    CrmObjectSecondaryLink,
} from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import { HairlinePanel, HairlineTable } from '@/components/crm/hairline-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Capture = {
    id: number;
    source: string;
    status: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    company: string | null;
    wilaya: string | null;
    error: string | null;
    matched_lead_id: number | null;
    matched_lead_title: string | null;
    created_at: string | null;
};

type MapsResult = {
    name: string;
    phone: string;
    email: string;
    company: string;
};

const SOURCE_LABELS: Record<string, string> = {
    meta_form: 'Meta form',
    csv: 'CSV',
    url: 'URL',
    maps_search: 'Maps search',
};

const STATUS_LABELS: Record<string, string> = {
    new: 'New',
    merged: 'Merged',
    rejected: 'Rejected',
    error: 'Error',
};

function emptyResult(): MapsResult {
    return { name: '', phone: '', email: '', company: '' };
}

export default function LeadCapturesIndex({
    captures,
    filters,
    sources,
    statuses,
}: {
    captures: Capture[];
    filters: { source: string; status: string };
    sources: string[];
    statuses: string[];
}) {
    const [results, setResults] = useState<MapsResult[]>([emptyResult()]);

    const filterHref = (next: { source?: string; status?: string }) => {
        const params = new URLSearchParams();
        const source = next.source ?? filters.source;
        const status = next.status ?? filters.status;

        if (source) {
            params.set('source', source);
        }

        if (status) {
            params.set('status', status);
        }

        const query = params.toString();

        return query ? `/crm/leads/captures?${query}` : '/crm/leads/captures';
    };

    return (
        <CrmShell title="Capture inbox" chrome="workspace">
            <div
                className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink"
                data-crm="list-workspace"
            >
                <CrmObjectHeader
                    title="Capture inbox"
                    description="Inbound identities from Meta forms, CSV, a public URL, or a maps search you ran. Same phone or email merges onto one Lead."
                    secondary={
                        <CrmObjectSecondaryLink href="/crm/leads">
                            Leads list
                        </CrmObjectSecondaryLink>
                    }
                />
                <div className="min-h-0 flex-1 overflow-y-auto bg-canvas">
                    <div className="space-y-4 px-4 py-3 sm:px-6">

                    <div className="flex flex-wrap items-center gap-2">
                        <FilterChip
                            href={filterHref({ source: '' })}
                            active={filters.source === ''}
                            label="All sources"
                        />
                        {sources.map((source) => (
                            <FilterChip
                                key={source}
                                href={filterHref({
                                    source:
                                        filters.source === source ? '' : source,
                                })}
                                active={filters.source === source}
                                label={SOURCE_LABELS[source] ?? source}
                            />
                        ))}
                        <span className="mx-1 h-4 w-px bg-hairline" />
                        <FilterChip
                            href={filterHref({ status: '' })}
                            active={filters.status === ''}
                            label="All statuses"
                        />
                        {statuses.map((status) => (
                            <FilterChip
                                key={status}
                                href={filterHref({
                                    status:
                                        filters.status === status ? '' : status,
                                })}
                                active={filters.status === status}
                                label={STATUS_LABELS[status] ?? status}
                            />
                        ))}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <HairlinePanel
                            title="CSV upload"
                            description="Name, phone, email, company, wilaya. Header aliases are accepted."
                        >
                            <Form
                                action="/crm/leads/captures/csv"
                                method="post"
                                encType="multipart/form-data"
                                className="space-y-3"
                                resetOnSuccess
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="capture-csv">
                                                CSV file
                                            </Label>
                                            <Input
                                                id="capture-csv"
                                                name="file"
                                                type="file"
                                                accept=".csv,text/csv,text/plain"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Upload CSV
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </HairlinePanel>

                        <HairlinePanel
                            title="Public URL"
                            description="One URL becomes one capture of what is publicly visible. Emails are never invented."
                        >
                            <Form
                                action="/crm/leads/captures/url"
                                method="post"
                                className="space-y-3"
                                resetOnSuccess
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="capture-url">
                                                Public URL
                                            </Label>
                                            <Input
                                                id="capture-url"
                                                name="url"
                                                type="url"
                                                inputMode="url"
                                                placeholder="https://"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Capture URL
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </HairlinePanel>

                        <HairlinePanel
                            title="Maps search"
                            description="You run the search. We store the query, wilaya, and the results you chose."
                        >
                            <Form
                                action="/crm/leads/captures/maps"
                                method="post"
                                className="space-y-3"
                                resetOnSuccess
                                onSuccess={() => setResults([emptyResult()])}
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="maps-query">
                                                    Query
                                                </Label>
                                                <Input
                                                    id="maps-query"
                                                    name="query"
                                                    required
                                                    placeholder="clinique dentaire"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="maps-wilaya">
                                                    Wilaya
                                                </Label>
                                                <Input
                                                    id="maps-wilaya"
                                                    name="wilaya"
                                                    required
                                                    placeholder="Alger"
                                                />
                                            </div>
                                        </div>
                                        {results.map((result, index) => (
                                            <div
                                                key={index}
                                                className="grid gap-2 rounded-lg border border-hairline p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-ui text-mute">
                                                        Chosen result{' '}
                                                        {index + 1}
                                                    </p>
                                                    {results.length > 1 ? (
                                                        <button
                                                            type="button"
                                                            className="text-mute hover:text-ink"
                                                            aria-label={`Remove result ${index + 1}`}
                                                            onClick={() =>
                                                                setResults(
                                                                    results.filter(
                                                                        (
                                                                            _,
                                                                            row,
                                                                        ) =>
                                                                            row !==
                                                                            index,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Trash className="size-3.5" aria-hidden />
                                                        </button>
                                                    ) : null}
                                                </div>
                                                <Input
                                                    name={`results[${index}][name]`}
                                                    value={result.name}
                                                    onChange={(event) =>
                                                        updateResult(
                                                            results,
                                                            setResults,
                                                            index,
                                                            'name',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Name"
                                                />
                                                <Input
                                                    name={`results[${index}][phone]`}
                                                    value={result.phone}
                                                    onChange={(event) =>
                                                        updateResult(
                                                            results,
                                                            setResults,
                                                            index,
                                                            'phone',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Phone +213"
                                                />
                                                <Input
                                                    name={`results[${index}][email]`}
                                                    value={result.email}
                                                    onChange={(event) =>
                                                        updateResult(
                                                            results,
                                                            setResults,
                                                            index,
                                                            'email',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Email if you saw one"
                                                />
                                                <Input
                                                    name={`results[${index}][company]`}
                                                    value={result.company}
                                                    onChange={(event) =>
                                                        updateResult(
                                                            results,
                                                            setResults,
                                                            index,
                                                            'company',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Company"
                                                />
                                            </div>
                                        ))}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setResults([
                                                        ...results,
                                                        emptyResult(),
                                                    ])
                                                }
                                            >
                                                <Plus className="size-3.5" aria-hidden />
                                                Add result
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="outline"
                                                disabled={processing}
                                            >
                                                Store search
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </HairlinePanel>
                    </div>

                    {captures.length === 0 ? (
                        <div className="border-t border-hairline py-8">
                            <p className="text-[13px] font-medium text-ink">
                                No captures in this filter
                            </p>
                            <p className="mt-1 text-[12px] text-mute">
                                Upload a CSV, paste a public URL, or store
                                results from a maps search you ran.
                            </p>
                        </div>
                    ) : (
                        <HairlineTable
                            minWidth={880}
                            empty="No captures in this filter."
                            columns={[
                                { key: 'identity', header: 'Identity' },
                                { key: 'source', header: 'Source' },
                                { key: 'status', header: 'Status' },
                                { key: 'lead', header: 'Merged into' },
                                { key: 'actions', header: 'Actions' },
                            ]}
                            rows={captures.map((capture) => ({
                                id: capture.id,
                                mobileTitle:
                                    capture.name ||
                                    capture.phone ||
                                    capture.email ||
                                    'Capture',
                                mobileMeta: [
                                    {
                                        label: 'Source',
                                        value:
                                            SOURCE_LABELS[capture.source] ??
                                            capture.source,
                                    },
                                    {
                                        label: 'Status',
                                        value:
                                            STATUS_LABELS[capture.status] ??
                                            capture.status,
                                    },
                                    {
                                        label: 'Phone',
                                        value: capture.phone || 'None',
                                    },
                                ],
                                cells: {
                                    identity: (
                                        <div>
                                            <p className="font-medium text-ink">
                                                {capture.name || 'Unnamed'}
                                            </p>
                                            <p className="aurora-text-body-sm text-mute">
                                                {[
                                                    capture.phone,
                                                    capture.email,
                                                    capture.company,
                                                    capture.wilaya,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                            {capture.error ? (
                                                <p className="aurora-text-body-sm mt-1 text-red-700">
                                                    {capture.error}
                                                </p>
                                            ) : null}
                                        </div>
                                    ),
                                    source:
                                        SOURCE_LABELS[capture.source] ??
                                        capture.source,
                                    status: (
                                        <Badge
                                            variant={
                                                capture.status === 'error'
                                                    ? 'destructive'
                                                    : capture.status ===
                                                        'merged'
                                                      ? 'default'
                                                      : 'outline'
                                            }
                                        >
                                            {STATUS_LABELS[capture.status] ??
                                                capture.status}
                                        </Badge>
                                    ),
                                    lead: capture.matched_lead_id ? (
                                        <Link
                                            href={`/crm/leads/${capture.matched_lead_id}`}
                                            className="font-medium text-ink hover:underline"
                                        >
                                            {capture.matched_lead_title ||
                                                `Lead ${capture.matched_lead_id}`}
                                        </Link>
                                    ) : (
                                        <span className="text-mute">
                                            Not merged
                                        </span>
                                    ),
                                    actions:
                                        capture.status === 'new' ? (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            `/crm/leads/captures/${capture.id}/accept`,
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.post(
                                                            `/crm/leads/captures/${capture.id}/reject`,
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-mute">
                                                {STATUS_LABELS[capture.status]}
                                            </span>
                                        ),
                                },
                            }))}
                        />
                    )}
                    </div>
                </div>
            </div>
        </CrmShell>
    );
}

function FilterChip({
    href,
    active,
    label,
}: {
    href: string;
    active: boolean;
    label: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'rounded-full border px-3 py-1 text-ui',
                active
                    ? 'border-hairline bg-canvas-soft font-medium text-ink'
                    : 'border-hairline text-mute hover:text-ink',
            )}
        >
            {label}
        </Link>
    );
}

function updateResult(
    results: MapsResult[],
    setResults: (next: MapsResult[]) => void,
    index: number,
    key: keyof MapsResult,
    value: string,
) {
    setResults(
        results.map((row, rowIndex) =>
            rowIndex === index ? { ...row, [key]: value } : row,
        ),
    );
}

LeadCapturesIndex.layout = {
    breadcrumbs: [
        { title: 'Leads', href: '/crm/leads' },
        { title: 'Captures', href: '/crm/leads/captures' },
    ],
};
