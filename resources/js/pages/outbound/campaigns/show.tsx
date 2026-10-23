import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { CampaignWorkspace } from '@/evo/outbound/CampaignWorkspace';
import { Field, OutboundSection } from '@/evo/outbound/section';
import type {
    CampaignDetail,
    OutboundMessageRow,
    TemplateRow,
} from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

type FilterRow = { id: number; name: string };
type MailboxRow = {
    id: number;
    name: string;
    from_address: string;
    daily_limit: number;
};

export default function CampaignShow({
    campaign,
    messages,
    filters,
    templates,
    mailboxes,
}: {
    campaign: CampaignDetail;
    messages: OutboundMessageRow[];
    filters: FilterRow[];
    templates: TemplateRow[];
    mailboxes: MailboxRow[];
}) {
    const editable = ['draft', 'scheduled'].includes(campaign.status);

    return (
        <OutboundShell title={campaign.name}>
            <OutboundPage
                title={campaign.name}
                description={`${campaign.saved_filter ? t('List: :name', { name: campaign.saved_filter.name }) : t('All contacts with email')} · ${
                    campaign.mailbox
                        ? `${t('Mailbox')}: ${campaign.mailbox.name}`
                        : t('Default enabled mailbox')
                } · ${t(campaign.status)}`}
                actions={
                    <div className="flex items-center gap-2">
                        {editable ? (
                            <Button onClick={() => router.post(`/outbound/campaigns/${campaign.id}/send-now`)}>
                                {t('Send now')}
                            </Button>
                        ) : null}
                        {['draft', 'scheduled', 'sending'].includes(campaign.status) ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            t('Cancel campaign :name? Unsent messages are dropped.', {
                                                name: campaign.name,
                                            }),
                                        )
                                    ) {
                                        router.post(`/outbound/campaigns/${campaign.id}/cancel`);
                                    }
                                }}
                            >
                                {t('Cancel')}
                            </Button>
                        ) : null}
                    </div>
                }
            >
                <CampaignWorkspace
                    campaign={campaign}
                    messages={messages}
                    onOpenContact={(id) => router.visit(`/crm/contacts/${id}`)}
                    scheduleForm={
                        campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                            <OutboundSection title={t('Schedule')}>
                                <Form
                                    action={`/outbound/campaigns/${campaign.id}/schedule`}
                                    method="post"
                                    className="flex items-end gap-3"
                                >
                                    {({ processing }) => (
                                        <>
                                            <Field label={t('Send at')}>
                                                <Input name="scheduled_at" type="datetime-local" required />
                                            </Field>
                                            <Button disabled={processing} variant="outline">
                                                {t('Schedule')}
                                            </Button>
                                        </>
                                    )}
                                </Form>
                                <p className="mt-2 text-[12px] text-[var(--evo-ink-muted)]">
                                    {t(
                                        'The runner expands the audience when the schedule is due, then sends within quiet hours and the mailbox daily cap.',
                                    )}
                                </p>
                            </OutboundSection>
                        ) : null
                    }
                />
                {campaign.preview ? (
                    <OutboundSection title={t('Audience preview')}>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <PreviewMetric label={t('Audience')} value={campaign.preview.audience_count} />
                            <PreviewMetric label={t('Eligible')} value={campaign.preview.eligible_count} />
                            <PreviewMetric label={t('Needs attention')} value={campaign.preview.ineligible_count} />
                        </div>
                        {campaign.preview.sample.length ? (
                            <div className="mt-4 space-y-2">
                                {campaign.preview.sample.map((row) => (
                                    <div key={row.contact_id} className="rounded-lg border border-[var(--evo-hairline)] px-3 py-2 text-[12px]">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="truncate font-medium">{row.email ?? t('No email')}</span>
                                            <span className={row.eligible ? 'text-emerald-700' : 'text-red-700'}>
                                                {row.eligible ? t('Eligible') : t('Excluded')}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-[var(--evo-ink-muted)]">{row.subject ?? '—'}</p>
                                        {!row.eligible && row.reason ? <p className="mt-1 text-red-700">{row.reason}</p> : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </OutboundSection>
                ) : null}
                {editable ? (
                    <OutboundSection title={t('Edit campaign')}>
                        <Form
                            action={`/outbound/campaigns/${campaign.id}`}
                            method="put"
                            className="grid gap-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Field label={t('Name')}>
                                            <Input
                                                name="name"
                                                defaultValue={campaign.name}
                                                required
                                            />
                                        </Field>
                                        <Field label={t('Audience (CRM list)')}>
                                            <NativeSelect
                                                name="saved_filter_id"
                                                defaultValue={campaign.saved_filter?.id ?? ''}
                                            >
                                                <option value="">
                                                    {t('All contacts with email')}
                                                </option>
                                                {filters.map((filter) => (
                                                    <option key={filter.id} value={filter.id}>
                                                        {filter.name}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>
                                        <Field label={t('Mailbox')}>
                                            <NativeSelect
                                                name="mailbox_id"
                                                defaultValue={campaign.mailbox?.id ?? ''}
                                            >
                                                <option value="">
                                                    {t('Default enabled mailbox')}
                                                </option>
                                                {mailboxes.map((mailbox) => (
                                                    <option key={mailbox.id} value={mailbox.id}>
                                                        {mailbox.name} — {mailbox.from_address}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Field label={t('Template')}>
                                            <NativeSelect
                                                name="template_id"
                                                defaultValue={campaign.template?.id ?? ''}
                                            >
                                                <option value="">{t('No template')}</option>
                                                {templates.map((template) => (
                                                    <option key={template.id} value={template.id}>
                                                        {template.name}
                                                    </option>
                                                ))}
                                            </NativeSelect>
                                        </Field>
                                        <Field label={t('Subject')} className="md:col-span-2">
                                            <Input
                                                name="subject"
                                                defaultValue={campaign.subject ?? ''}
                                            />
                                        </Field>
                                    </div>
                                    <Field label={t('Uncertain email policy')}>
                                        <NativeSelect
                                            name="email_verification_policy"
                                            defaultValue={campaign.email_verification_policy ?? 'strict'}
                                        >
                                            <option value="strict">
                                                {t('Strict — block uncertain results')}
                                            </option>
                                            <option value="allow_catch_all">
                                                {t('Allow catch-all if deployment permits')}
                                            </option>
                                            <option value="allow_unknown">
                                                {t('Allow unknown if deployment permits')}
                                            </option>
                                            <option value="allow_uncertain">
                                                {t('Allow uncertain results if deployment permits')}
                                            </option>
                                        </NativeSelect>
                                    </Field>
                                    <Field label={t('Campaign daily limit')}>
                                        <Input
                                            name="daily_limit"
                                            type="number"
                                            min={1}
                                            max={1000}
                                            defaultValue={campaign.daily_limit}
                                            required
                                        />
                                    </Field>
                                    <Field label={t('Body (text)')}>
                                        <Textarea
                                            name="body"
                                            rows={5}
                                            defaultValue={campaign.body}
                                            required
                                        />
                                    </Field>
                                    <Field label={t('Body (HTML, optional)')}>
                                        <Textarea
                                            name="body_html"
                                            rows={4}
                                            defaultValue={campaign.body_html ?? ''}
                                        />
                                    </Field>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <Field label={t('Campaign state')}>
                                            <NativeSelect
                                                name="mode"
                                                defaultValue={
                                                    campaign.status === 'scheduled'
                                                        ? 'scheduled'
                                                        : 'draft'
                                                }
                                            >
                                                <option value="draft">{t('Save as draft')}</option>
                                                <option value="scheduled">{t('Schedule')}</option>
                                            </NativeSelect>
                                        </Field>
                                        <Field label={t('Scheduled at')}>
                                            <Input
                                                name="scheduled_at"
                                                type="datetime-local"
                                                defaultValue={campaign.scheduled_at?.slice(0, 16) ?? ''}
                                            />
                                        </Field>
                                        <div className="flex items-end">
                                            <Button disabled={processing} variant="outline">
                                                {t('Save changes')}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Form>
                    </OutboundSection>
                ) : null}
            </OutboundPage>
        </OutboundShell>
    );
}

CampaignShow.layout = {
    breadcrumbs: [
        { title: t('Campaigns'), href: '/outbound/campaigns' },
        { title: t('Campaign'), href: '#' },
    ],
};

function PreviewMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-[var(--evo-hairline)] px-3 py-2">
            <p className="text-[11px] text-[var(--evo-ink-muted)]">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}
