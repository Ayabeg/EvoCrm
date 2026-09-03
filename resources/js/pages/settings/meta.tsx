import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Mapping = { meta_field: string; crm_property: string };
type ConversionConfig = {
    crm_event: string;
    meta_event: string;
    enabled: boolean;
    pixel_id: string | null;
    last_success_at: string | null;
    last_failure_at: string | null;
    sent_count: number;
    failed_count: number;
};
type LogRow = {
    id: number;
    status: string;
    error: string | null;
    created_at: string;
    event_type?: string;
    crm_event?: string;
    meta_event?: string;
    provider_event_id?: string;
};

function metric(value: string | number | null | undefined, empty = 'Not enough data') {
    if (value === null || value === undefined || value === '') {
        return empty;
    }

    return String(value);
}

export default function MetaSettings({
    connected,
    app_id_set,
    ad_account_id_set,
    ad_accounts,
    selected_ad_account_id,
    graph_version,
    reason,
    can_manage,
    expires_at,
    webhook_url,
    pages,
    instagram_accounts,
    forms,
    field_mappings,
    default_mappings,
    conversion_configs,
    conversion_events,
    sync_runs,
    webhook_events,
    conversion_logs,
}: {
    connected: boolean;
    app_id_set: boolean;
    ad_account_id_set: boolean;
    ad_accounts: { id: string; name: string }[];
    selected_ad_account_id: string | null;
    graph_version: string;
    reason: string | null;
    can_manage: boolean;
    expires_at: string | null;
    webhook_url: string;
    pages: { id: string; name: string }[];
    instagram_accounts: { id: string; name: string }[];
    forms: { id: number; name: string; status: string; external_id: string }[];
    field_mappings: Mapping[];
    default_mappings: Record<string, string>;
    conversion_configs: ConversionConfig[];
    conversion_events: string[];
    sync_runs: { id: number; kind: string; mode: string; status: string; error: string | null; finished_at: string | null }[];
    webhook_events: LogRow[];
    conversion_logs: LogRow[];
}) {
    const initialMappings =
        field_mappings.length > 0
            ? field_mappings
            : Object.entries(default_mappings).map(([meta_field, crm_property]) => ({
                  meta_field,
                  crm_property,
              }));
    const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
    const pixel = conversion_configs.find((config) => config.pixel_id)?.pixel_id ?? '';

    return (
        <>
            <Head title="Meta" />
            <div className="space-y-8">
                <div>
                    <h1 className="text-xl font-semibold">Meta</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Connection, lead forms, field mapping, and conversion feedback.
                        Tokens stay encrypted on the server.
                    </p>
                </div>

                <Card className="space-y-2 p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={connected ? 'default' : 'secondary'}>
                            {connected ? 'Connected' : 'Needs setup'}
                        </Badge>
                        {expires_at ? (
                            <span className="text-xs text-muted-foreground">
                                Token expires {new Date(expires_at).toLocaleDateString('en-GB')}
                            </span>
                        ) : null}
                    </div>
                    <p>App ID: {app_id_set ? 'set' : 'empty'}</p>
                    <p>Ad account: {ad_account_id_set ? 'selected' : 'not selected'}</p>
                    <p>Graph version: {graph_version}</p>
                    {reason ? <p className="text-brand">{reason}</p> : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                            <Link href="/settings/apps/meta">Connection details</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                            <Link href="/auth/meta">Reconnect</Link>
                        </Button>
                    </div>
                </Card>

                {ad_accounts.length > 0 ? (
                    <Card className="space-y-4 p-4">
                        <h2 className="text-sm font-semibold">Ad accounts</h2>
                        <Form action="/settings/meta/ad-account" method="put">
                            {({ processing, errors }) => (
                                <div className="space-y-3">
                                    <label htmlFor="meta-ad-account" className="block text-xs font-medium">
                                        Marketing ad account
                                    </label>
                                    <select
                                        id="meta-ad-account"
                                        name="ad_account_id"
                                        defaultValue={selected_ad_account_id ?? ''}
                                        disabled={!can_manage || processing}
                                        className="h-9 w-full rounded-md border border-hairline bg-canvas px-3 text-sm"
                                    >
                                        <option value="" disabled>
                                            Select an account
                                        </option>
                                        {ad_accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.ad_account_id ? (
                                        <p className="text-xs text-destructive">{errors.ad_account_id}</p>
                                    ) : null}
                                    <Button type="submit" size="sm" disabled={!can_manage || processing}>
                                        Save account
                                    </Button>
                                </div>
                            )}
                        </Form>
                        <div className="grid gap-3 text-sm md:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Pages</p>
                                <ul className="mt-1 list-inside list-disc">
                                    {pages.length === 0 ? <li className="text-muted-foreground">None</li> : null}
                                    {pages.map((page) => (
                                        <li key={page.id}>{page.name}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Instagram</p>
                                <ul className="mt-1 list-inside list-disc">
                                    {instagram_accounts.length === 0 ? (
                                        <li className="text-muted-foreground">None</li>
                                    ) : null}
                                    {instagram_accounts.map((account) => (
                                        <li key={account.id}>{account.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ) : null}

                <Card className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold">Lead forms & webhook</h2>
                    <p className="text-xs text-muted-foreground">
                        Subscribe the Meta app to <code>leadgen</code> on this callback. The
                        workspace key is the tenant identity.
                    </p>
                    <code className="block break-all rounded-md bg-canvas-soft px-3 py-2 text-xs">
                        {webhook_url}
                    </code>
                    {forms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No forms synced yet.</p>
                    ) : (
                        <ul className="space-y-1 text-sm">
                            {forms.map((form) => (
                                <li key={form.id} className="flex justify-between gap-2">
                                    <span>{form.name}</span>
                                    <Badge variant="secondary">{form.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className="space-y-4 p-4">
                    <h2 className="text-sm font-semibold">Field mapping</h2>
                    <p className="text-xs text-muted-foreground">
                        Map Meta form fields to EvoSales properties. Unmapped custom fields
                        stay on the lead payload.
                    </p>
                    <Form
                        action="/settings/meta/mappings"
                        method="put"
                        transform={() => ({ mappings })}
                    >
                        {({ processing }) => (
                            <div className="space-y-3">
                                {mappings.map((row, index) => (
                                    <div key={`${row.meta_field}-${index}`} className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={row.meta_field}
                                            onChange={(event) => {
                                                const next = [...mappings];
                                                next[index] = { ...row, meta_field: event.target.value };
                                                setMappings(next);
                                            }}
                                            placeholder="Meta field"
                                            disabled={!can_manage}
                                        />
                                        <Input
                                            value={row.crm_property}
                                            onChange={(event) => {
                                                const next = [...mappings];
                                                next[index] = { ...row, crm_property: event.target.value };
                                                setMappings(next);
                                            }}
                                            placeholder="EvoSales property"
                                            disabled={!can_manage}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={!can_manage}
                                        onClick={() => setMappings([...mappings, { meta_field: '', crm_property: '' }])}
                                    >
                                        Add field
                                    </Button>
                                    <Button type="submit" size="sm" disabled={!can_manage || processing}>
                                        Save mappings
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </Card>

                <Card className="space-y-4 p-4">
                    <h2 className="text-sm font-semibold">Conversions API</h2>
                    <p className="text-xs text-muted-foreground">
                        CRM lifecycle events map to Meta standard events. Email and phone are
                        hashed before send.
                    </p>
                    <Form action="/settings/meta/conversions" method="put">
                        {({ processing }) => (
                            <div className="space-y-3">
                                <label className="block text-xs font-medium" htmlFor="pixel_id">
                                    Pixel / dataset ID
                                </label>
                                <Input
                                    id="pixel_id"
                                    name="pixel_id"
                                    defaultValue={pixel}
                                    disabled={!can_manage}
                                    placeholder="1234567890"
                                />
                                {conversion_configs.map((config, index) => (
                                    <div key={config.crm_event} className="grid gap-2 rounded-md border border-hairline p-3 md:grid-cols-4">
                                        <input type="hidden" name={`configs[${index}][crm_event]`} value={config.crm_event} />
                                        <div>
                                            <p className="text-xs text-muted-foreground">EvoSales</p>
                                            <p className="text-sm font-medium">{config.crm_event}</p>
                                        </div>
                                        <select
                                            name={`configs[${index}][meta_event]`}
                                            defaultValue={config.meta_event}
                                            disabled={!can_manage}
                                            className="h-9 rounded-md border border-hairline bg-canvas px-2 text-sm"
                                        >
                                            {conversion_events.map((eventName) => (
                                                <option key={eventName} value={eventName}>
                                                    {eventName}
                                                </option>
                                            ))}
                                        </select>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="hidden" name={`configs[${index}][enabled]`} value="0" />
                                            <input
                                                type="checkbox"
                                                name={`configs[${index}][enabled]`}
                                                value="1"
                                                defaultChecked={config.enabled}
                                                disabled={!can_manage}
                                            />
                                            Enabled
                                        </label>
                                        <div className="text-xs text-muted-foreground">
                                            <p>Sent {config.sent_count}</p>
                                            <p>Failed {config.failed_count}</p>
                                            <p>Last ok {metric(config.last_success_at ? new Date(config.last_success_at).toLocaleString() : null)}</p>
                                            <p>Last fail {metric(config.last_failure_at ? new Date(config.last_failure_at).toLocaleString() : null)}</p>
                                        </div>
                                    </div>
                                ))}
                                <Button type="submit" size="sm" disabled={!can_manage || processing}>
                                    Save conversions
                                </Button>
                            </div>
                        )}
                    </Form>
                </Card>

                <Card className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold">Sync</h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { kind: 'ads', label: 'Ads hierarchy' },
                            { kind: 'forms', label: 'Lead forms' },
                            { kind: 'leads', label: 'Historical leads' },
                            { kind: 'all', label: 'Full sync' },
                        ].map((action) => (
                            <Form key={action.kind} action="/settings/meta/sync" method="post">
                                {({ processing }) => (
                                    <>
                                        <input type="hidden" name="kind" value={action.kind} />
                                        <Button type="submit" size="sm" variant="outline" disabled={!can_manage || processing}>
                                            {action.label}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        ))}
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                        {sync_runs.length === 0 ? <li>No sync runs yet.</li> : null}
                        {sync_runs.map((run) => (
                            <li key={run.id}>
                                {run.kind} · {run.mode} · {run.status}
                                {run.error ? ` — ${run.error}` : ''}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="space-y-3 p-4">
                    <h2 className="text-sm font-semibold">Logs</h2>
                    <p className="text-xs text-muted-foreground">
                        Webhook and conversion outcomes. Payloads are stored without tokens.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Webhooks</p>
                            <ul className="mt-1 space-y-1 text-xs">
                                {webhook_events.length === 0 ? <li>None</li> : null}
                                {webhook_events.map((event) => (
                                    <li key={event.id}>
                                        {event.event_type} · {event.status}
                                        {event.error ? ` — ${event.error}` : ''}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">Conversions</p>
                            <ul className="mt-1 space-y-1 text-xs">
                                {conversion_logs.length === 0 ? <li>None</li> : null}
                                {conversion_logs.map((event) => (
                                    <li key={event.id}>
                                        {event.crm_event} → {event.meta_event} · {event.status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

MetaSettings.layout = {
    breadcrumbs: [{ title: 'Meta', href: '/settings/meta' }],
};
