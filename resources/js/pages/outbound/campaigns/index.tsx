import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { CampaignList } from '@/evo/outbound/CampaignList';
import { Field, OutboundSection } from '@/evo/outbound/section';
import type { CampaignRow, TemplateRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

type FilterRow = { id: number; name: string };
type MailboxRow = { id: number; name: string; from_address: string; daily_limit: number };

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
    const [templateId, setTemplateId] = useState('');
    const [mode, setMode] = useState('draft');
    const [search, setSearch] = useState('');
    const template = templates.find((item) => String(item.id) === templateId);
    const visible = campaigns.filter((campaign) =>
        campaign.name.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <OutboundShell title={t('Campaigns')}>
            <OutboundPage
                title={t('Broadcast campaigns')}
                description={t(
                    'One-shot sends to a CRM audience — the newsletter path. Every recipient is logged in the outbox; quiet hours, suppression, and daily caps still apply.',
                )}
            >
                <OutboundSection title={t('New campaign')}>
                    <Form action="/outbound/campaigns" method="post" className="grid gap-3" resetOnSuccess>
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label={t('Name')}>
                                        <Input name="name" required placeholder={t('August clinic newsletter')} />
                                    </Field>
                                    <Field label={t('Audience (CRM list)')}>
                                        <NativeSelect name="saved_filter_id">
                                            <option value="">
                                                {t('All contacts with email (:count)', { count: audience_size })}
                                            </option>
                                            {filters.map((filter) => (
                                                <option key={filter.id} value={filter.id}>
                                                    {t('List: :name', { name: filter.name })}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </Field>
                                    <Field label={t('Mailbox')}>
                                        <NativeSelect name="mailbox_id">
                                            <option value="">{t('Default enabled mailbox')}</option>
                                            {mailboxes.map((box) => (
                                                <option key={box.id} value={box.id}>
                                                    {t(':name — :address (:limit/day)', {
                                                        name: box.name,
                                                        address: box.from_address,
                                                        limit: box.daily_limit,
                                                    })}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </Field>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label={t('Template')}>
                                        <NativeSelect
                                            value={templateId}
                                            onChange={(event) => setTemplateId(event.target.value)}
                                        >
                                            <option value="">{t('No template')}</option>
                                            {templates.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <input type="hidden" name="template_id" value={templateId} />
                                    </Field>
                                    <Field label={t('Subject')} className="md:col-span-2">
                                        <Input
                                            name="subject"
                                            placeholder={t('Newsletter subject — {{first_name}} works')}
                                            defaultValue={template?.subject ?? ''}
                                            key={template?.subject ?? 'subject'}
                                        />
                                    </Field>
                                </div>
                                <Field label={t('Body (text) — {{first_name}} {{company}} {{unsub}}')}>
                                    <Textarea
                                        name="body"
                                        rows={5}
                                        placeholder={'Bonjour {{first_name}},\n\n…\n\nSe désabonner : {{unsub}}'}
                                        defaultValue={template?.body ?? ''}
                                        key={template?.body ?? 'body'}
                                    />
                                    {errors.body ? (
                                        <p className="mt-1 text-[11px] text-[var(--evo-danger)]">{errors.body}</p>
                                    ) : null}
                                </Field>
                                <Field label={t('Body (HTML, optional)')}>
                                    <Textarea
                                        name="body_html"
                                        rows={4}
                                        placeholder="<p>Bonjour {{first_name}}, …</p>"
                                        defaultValue={template?.body_html ?? ''}
                                        key={template?.body_html ?? 'body_html'}
                                    />
                                </Field>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Field label={t('When')}>
                                        <NativeSelect
                                            name="mode"
                                            value={mode}
                                            onChange={(event) => setMode(event.target.value)}
                                        >
                                            <option value="draft">{t('Save as draft')}</option>
                                            <option value="scheduled">{t('Schedule')}</option>
                                            <option value="send_now">{t('Send now')}</option>
                                        </NativeSelect>
                                    </Field>
                                    {mode === 'scheduled' ? (
                                        <Field label={t('Scheduled at')}>
                                            <Input
                                                name="scheduled_at"
                                                type="datetime-local"
                                                required={mode === 'scheduled'}
                                            />
                                        </Field>
                                    ) : null}
                                    <div className="flex items-end">
                                        <Button disabled={processing}>
                                            {mode === 'send_now'
                                                ? t('Queue campaign')
                                                : mode === 'scheduled'
                                                  ? t('Schedule')
                                                  : t('Create draft')}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>

                <CampaignList
                    campaigns={visible}
                    search={search}
                    onSearchChange={setSearch}
                    onOpen={(campaign) => router.visit(`/outbound/campaigns/${campaign.id}`)}
                    onSendNow={(campaign) => router.post(`/outbound/campaigns/${campaign.id}/send-now`)}
                    onCancel={(campaign) => {
                        if (window.confirm(t('Cancel campaign :name? Unsent messages are dropped.', { name: campaign.name }))) {
                            router.post(`/outbound/campaigns/${campaign.id}/cancel`);
                        }
                    }}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

CampaignsIndex.layout = {
    breadcrumbs: [{ title: t('Campaigns'), href: '/outbound/campaigns' }],
};
