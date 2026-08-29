import { Form, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Counts = {
    queued: number;
    deferred: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
};

type CampaignRow = {
    id: number;
    name: string;
    status: string;
    subject?: string | null;
    scheduled_at?: string | null;
    sent_at?: string | null;
    audience_count: number;
    suppressed_count: number;
    created_at: string;
    saved_filter?: { id: number; name: string } | null;
    template?: { id: number; name: string } | null;
    mailbox?: { id: number; name: string; from_address: string } | null;
    counts: Counts;
};

type FilterRow = { id: number; name: string };
type TemplateRow = {
    id: number;
    name: string;
    subject?: string | null;
    body: string;
    body_html?: string | null;
};
type MailboxRow = {
    id: number;
    name: string;
    from_address: string;
    daily_limit: number;
};

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
    if (status === 'sent') {
        return 'default';
    }

    if (status === 'sending' || status === 'scheduled') {
        return 'secondary';
    }

    return 'outline';
}

export default function CampaignsIndex({
    campaigns,
    filters,
    templates,
    mailboxes,
    audience_size,
}: {
    campaigns: CampaignRow[];
    filters: FilterRow[];
    templates: TemplateRow[];
    mailboxes: MailboxRow[];
    audience_size: number;
}) {
    const [templateId, setTemplateId] = useState<string>('');
    const [mode, setMode] = useState<string>('draft');

    const template = templates.find((t) => String(t.id) === templateId);

    return (
        <OutboundShell title="Campaigns">
            <OutboundPage
                title="Broadcast campaigns"
                description="One-shot sends to a CRM audience — the newsletter path. Every recipient is logged in the outbox; quiet hours, suppression, and daily caps still apply."
            >
                <section className="border-t border-hairline pt-3">
                    <h2 className="mb-3 font-medium">New campaign</h2>
                    <Form
                        action="/outbound/campaigns"
                        method="post"
                        className="grid gap-3"
                        resetOnSuccess
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            name="name"
                                            required
                                            placeholder="August clinic newsletter"
                                        />
                                    </div>
                                    <div>
                                        <Label>Audience (CRM list)</Label>
                                        <select
                                            name="saved_filter_id"
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="">
                                                All contacts with email (
                                                {audience_size})
                                            </option>
                                            {filters.map((filter) => (
                                                <option
                                                    key={filter.id}
                                                    value={filter.id}
                                                >
                                                    List: {filter.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Mailbox</Label>
                                        <select
                                            name="mailbox_id"
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="">
                                                Default enabled mailbox
                                            </option>
                                            {mailboxes.map((box) => (
                                                <option
                                                    key={box.id}
                                                    value={box.id}
                                                >
                                                    {box.name} —{' '}
                                                    {box.from_address} (
                                                    {box.daily_limit}/day)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <Label>Template</Label>
                                        <select
                                            value={templateId}
                                            onChange={(event) =>
                                                setTemplateId(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="">
                                                No template
                                            </option>
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="hidden"
                                            name="template_id"
                                            value={templateId}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Subject</Label>
                                        <Input
                                            name="subject"
                                            placeholder="Newsletter subject — {{first_name}} works"
                                            defaultValue={
                                                template?.subject ?? ''
                                            }
                                            key={template?.subject ?? 'subject'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>
                                        Body (text) —{' '}
                                        {'{{first_name}} {{company}} {{unsub}}'}
                                    </Label>
                                    <textarea
                                        name="body"
                                        rows={5}
                                        placeholder={
                                            'Bonjour {{first_name}},\n\n…\n\nSe désabonner : {{unsub}}'
                                        }
                                        defaultValue={template?.body ?? ''}
                                        key={template?.body ?? 'body'}
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                    {errors.body ? (
                                        <p className="mt-1 text-xs text-brand">
                                            {errors.body}
                                        </p>
                                    ) : null}
                                </div>
                                <div>
                                    <Label>Body (HTML, optional)</Label>
                                    <textarea
                                        name="body_html"
                                        rows={4}
                                        placeholder="<p>Bonjour {{first_name}}, …</p>"
                                        defaultValue={template?.body_html ?? ''}
                                        key={template?.body_html ?? 'body_html'}
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div>
                                        <Label>When</Label>
                                        <select
                                            name="mode"
                                            value={mode}
                                            onChange={(event) =>
                                                setMode(event.target.value)
                                            }
                                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        >
                                            <option value="draft">
                                                Save as draft
                                            </option>
                                            <option value="scheduled">
                                                Schedule
                                            </option>
                                            <option value="send_now">
                                                Send now
                                            </option>
                                        </select>
                                    </div>
                                    {mode === 'scheduled' ? (
                                        <div>
                                            <Label>Scheduled at</Label>
                                            <Input
                                                name="scheduled_at"
                                                type="datetime-local"
                                                required={mode === 'scheduled'}
                                            />
                                        </div>
                                    ) : null}
                                    <div className="flex items-end">
                                        <Button disabled={processing}>
                                            {mode === 'send_now'
                                                ? 'Queue campaign'
                                                : mode === 'scheduled'
                                                  ? 'Schedule'
                                                  : 'Create draft'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                <section className="overflow-x-auto border-t border-hairline">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-2">Campaign</th>
                                <th className="px-4 py-2">Audience</th>
                                <th className="px-4 py-2">Mailbox</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Progress</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td
                                        className="px-4 py-6 text-muted-foreground"
                                        colSpan={6}
                                    >
                                        No campaigns yet. Create one above —
                                        pick a list, a template, and a mailbox.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr
                                        key={campaign.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/outbound/campaigns/${campaign.id}`}
                                                className="font-medium text-ink hover:underline"
                                            >
                                                {campaign.name}
                                            </Link>
                                            <span className="block text-xs text-muted-foreground">
                                                {campaign.template
                                                    ? `Template: ${campaign.template.name}`
                                                    : 'Custom body'}
                                                {campaign.scheduled_at &&
                                                ['scheduled', 'draft'].includes(
                                                    campaign.status,
                                                )
                                                    ? ` · scheduled ${campaign.scheduled_at}`
                                                    : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.saved_filter
                                                ? campaign.saved_filter.name
                                                : 'All contacts with email'}
                                            {campaign.audience_count > 0 ? (
                                                <span className="block text-xs text-muted-foreground">
                                                    {campaign.audience_count}{' '}
                                                    reached
                                                    {campaign.suppressed_count >
                                                    0
                                                        ? ` · ${campaign.suppressed_count} suppressed`
                                                        : ''}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-2">
                                            {campaign.mailbox?.name ??
                                                'Default'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Badge
                                                variant={statusVariant(
                                                    campaign.status,
                                                )}
                                            >
                                                {campaign.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">
                                            {campaign.counts.sent} sent ·{' '}
                                            {campaign.counts.queued +
                                                campaign.counts.deferred}{' '}
                                            pending · {campaign.counts.failed}{' '}
                                            failed · {campaign.counts.opened}{' '}
                                            opened · {campaign.counts.clicked}{' '}
                                            clicked
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {['draft', 'scheduled'].includes(
                                                campaign.status,
                                            ) ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            `/outbound/campaigns/${campaign.id}/send-now`,
                                                        )
                                                    }
                                                >
                                                    Send now
                                                </Button>
                                            ) : null}
                                            {[
                                                'draft',
                                                'scheduled',
                                                'sending',
                                            ].includes(campaign.status) ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-ink hover:underline"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Cancel campaign ${campaign.name}? Unsent messages are dropped.`,
                                                            )
                                                        ) {
                                                            router.post(
                                                                `/outbound/campaigns/${campaign.id}/cancel`,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>
            </OutboundPage>
        </OutboundShell>
    );
}

CampaignsIndex.layout = {
    breadcrumbs: [{ title: 'Campaigns', href: '/outbound/campaigns' }],
};
