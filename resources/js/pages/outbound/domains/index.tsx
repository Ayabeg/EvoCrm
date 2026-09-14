import { Form, router } from '@inertiajs/react';
import { Check, Copy } from '@phosphor-icons/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ChecklistItem = {
    key: string;
    label: string;
    type: string;
    host: string;
    value?: string | null;
    ready: boolean;
};

type DomainRow = {
    id: number;
    domain: string;
    status: string;
    spf_record?: string | null;
    dkim_selector?: string | null;
    dkim_record?: string | null;
    dmarc_record?: string | null;
    notes?: string | null;
    verified_at?: string | null;
    checklist: ChecklistItem[];
};

function CopyRecord({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            type="button"
            title="Copy record"
            className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/40"
            onClick={() => {
                navigator.clipboard?.writeText(value);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
            }}
        >
            {copied ? (
                <Check className="size-3" aria-hidden />
            ) : (
                <Copy className="size-3" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

export default function DomainsIndex({ domains }: { domains: DomainRow[] }) {
    return (
        <OutboundShell title="Sending domains">
            <OutboundPage
                title="Sending domains"
                description="The domains your mailboxes send from. Publish the SPF, DKIM, and DMARC records at your DNS provider, then mark the domain verified. EvoSales stores the checklist — it never calls a DNS API."
            >
                <section className="border-t border-hairline pt-3">
                    <h2 className="mb-3 font-medium">Add domain</h2>
                    <Form
                        action="/outbound/domains"
                        method="post"
                        className="grid gap-3 md:grid-cols-2"
                        resetOnSuccess
                    >
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <Label>Domain</Label>
                                    <Input
                                        name="domain"
                                        required
                                        placeholder="evotechly.com"
                                    />
                                    {errors.domain ? (
                                        <p className="mt-1 text-xs text-brand">
                                            {errors.domain}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <Label>SPF record (TXT)</Label>
                                    <Input
                                        name="spf_record"
                                        placeholder="v=spf1 include:your-smtp-provider.tld ~all"
                                    />
                                </div>
                                <div>
                                    <Label>DKIM selector</Label>
                                    <Input
                                        name="dkim_selector"
                                        placeholder="default"
                                    />
                                </div>
                                <div>
                                    <Label>DKIM record (TXT)</Label>
                                    <Input
                                        name="dkim_record"
                                        placeholder="v=DKIM1; k=rsa; p=…"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>
                                        DMARC record (TXT) — prefilled if left
                                        blank
                                    </Label>
                                    <Input
                                        name="dmarc_record"
                                        placeholder="v=DMARC1; p=quarantine; rua=mailto:postmaster@…"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button disabled={processing}>
                                        Add domain
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                <div className="space-y-3">
                    {domains.length === 0 ? (
                        <p className="border-t border-hairline py-4 text-[13px] text-muted-foreground">
                            No sending domain yet. Add the domain your From
                            addresses use.
                        </p>
                    ) : null}
                    {domains.map((domain) => (
                        <article key={domain.id} className="space-y-3 border-t border-hairline pt-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                    {domain.domain}
                                </span>
                                <Badge
                                    variant={
                                        domain.status === 'verified'
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {domain.status}
                                </Badge>
                                {domain.verified_at ? (
                                    <span className="text-xs text-muted-foreground">
                                        verified {domain.verified_at}
                                    </span>
                                ) : null}
                                <span className="ms-auto flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.post(
                                                `/outbound/domains/${domain.id}/verify`,
                                            )
                                        }
                                    >
                                        {domain.status === 'verified'
                                            ? 'Mark unverified'
                                            : 'Mark verified'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-ink hover:underline"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    `Delete domain ${domain.domain}?`,
                                                )
                                            ) {
                                                router.delete(
                                                    `/outbound/domains/${domain.id}`,
                                                );
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </span>
                            </div>

                            <div className="overflow-hidden rounded-md border border-hairline">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-left">
                                        <tr>
                                            <th className="px-3 py-1.5">
                                                Record
                                            </th>
                                            <th className="px-3 py-1.5">
                                                Type
                                            </th>
                                            <th className="px-3 py-1.5">
                                                Host
                                            </th>
                                            <th className="px-3 py-1.5">
                                                Value to publish
                                            </th>
                                            <th className="px-3 py-1.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {domain.checklist.map((item) => (
                                            <tr
                                                key={item.key}
                                                className="border-t border-hairline"
                                            >
                                                <td className="px-3 py-1.5 font-medium">
                                                    {item.label}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    {item.type}
                                                </td>
                                                <td className="px-3 py-1.5 font-mono text-xs">
                                                    {item.host}
                                                </td>
                                                <td
                                                    className="max-w-96 truncate px-3 py-1.5 font-mono text-xs"
                                                    title={item.value ?? ''}
                                                >
                                                    {item.value ?? (
                                                        <span className="text-brand">
                                                            missing — paste it
                                                            below
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-1.5 text-right">
                                                    {item.value ? (
                                                        <CopyRecord
                                                            value={item.value}
                                                        />
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <details className="rounded-md border border-hairline px-3 py-2">
                                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                    Edit records
                                </summary>
                                <Form
                                    action={`/outbound/domains/${domain.id}`}
                                    method="put"
                                    className="mt-3 grid gap-3 md:grid-cols-2"
                                >
                                    {({ processing }) => (
                                        <>
                                            <div>
                                                <Label>SPF record</Label>
                                                <Input
                                                    name="spf_record"
                                                    defaultValue={
                                                        domain.spf_record ?? ''
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>DKIM selector</Label>
                                                <Input
                                                    name="dkim_selector"
                                                    defaultValue={
                                                        domain.dkim_selector ??
                                                        ''
                                                    }
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>DKIM record</Label>
                                                <Input
                                                    name="dkim_record"
                                                    defaultValue={
                                                        domain.dkim_record ?? ''
                                                    }
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>DMARC record</Label>
                                                <Input
                                                    name="dmarc_record"
                                                    defaultValue={
                                                        domain.dmarc_record ??
                                                        ''
                                                    }
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Notes</Label>
                                                <Input
                                                    name="notes"
                                                    defaultValue={
                                                        domain.notes ?? ''
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Button
                                                    disabled={processing}
                                                    size="sm"
                                                >
                                                    Save records
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </details>
                        </article>
                    ))}
                </div>
            </OutboundPage>
        </OutboundShell>
    );
}

DomainsIndex.layout = {
    breadcrumbs: [{ title: 'Domains', href: '/outbound/domains' }],
};
