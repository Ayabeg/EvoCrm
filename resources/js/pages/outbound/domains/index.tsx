import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { DomainList } from '@/evo/outbound/DomainList';
import { Field, OutboundSection } from '@/evo/outbound/section';
import type { DomainRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { t } from '@/lib/i18n';

export default function DomainsIndex({ domains }: { domains: DomainRow[] }) {
    return (
        <OutboundShell title={t('Sending domains')}>
            <OutboundPage
                title={t('Sending domains')}
                description={t(
                    'The domains your mailboxes send from. Publish the SPF, DKIM, and DMARC records at your DNS provider, then mark the domain verified. EvoSales stores the checklist — it never calls a DNS API.',
                )}
            >
                <OutboundSection title={t('Add domain')}>
                    <Form
                        action="/outbound/domains"
                        method="post"
                        className="grid gap-3 md:grid-cols-2"
                        resetOnSuccess
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field label={t('Domain')} error={errors.domain}>
                                    <Input name="domain" required placeholder="evotechly.com" />
                                </Field>
                                <Field label={t('SPF record (TXT)')}>
                                    <Input
                                        name="spf_record"
                                        placeholder="v=spf1 include:your-smtp-provider.tld ~all"
                                    />
                                </Field>
                                <Field label={t('DKIM selector')}>
                                    <Input name="dkim_selector" placeholder="default" />
                                </Field>
                                <Field label={t('DKIM record (TXT)')}>
                                    <Input name="dkim_record" placeholder="v=DKIM1; k=rsa; p=…" />
                                </Field>
                                <Field
                                    label={t('DMARC record (TXT) — prefilled if left blank')}
                                    className="md:col-span-2"
                                >
                                    <Input
                                        name="dmarc_record"
                                        placeholder="v=DMARC1; p=quarantine; rua=mailto:postmaster@…"
                                    />
                                </Field>
                                <div className="flex items-end">
                                    <Button disabled={processing}>{t('Add domain')}</Button>
                                </div>
                            </>
                        )}
                    </Form>
                </OutboundSection>

                <DomainList
                    domains={domains}
                    renderActions={(domain) => (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(`/outbound/domains/${domain.id}/verify`)}
                            >
                                {domain.status === 'verified' ? t('Mark unverified') : t('Mark verified')}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (window.confirm(t('Delete domain :domain?', { domain: domain.domain }))) {
                                        router.delete(`/outbound/domains/${domain.id}`);
                                    }
                                }}
                            >
                                {t('Delete')}
                            </Button>
                        </>
                    )}
                    renderEditor={(domain) => (
                        <Form
                            action={`/outbound/domains/${domain.id}`}
                            method="put"
                            className="mt-3 grid gap-3 md:grid-cols-2"
                        >
                            {({ processing }) => (
                                <>
                                    <Field label={t('SPF record')}>
                                        <Input name="spf_record" defaultValue={domain.spf_record ?? ''} />
                                    </Field>
                                    <Field label={t('DKIM selector')}>
                                        <Input name="dkim_selector" defaultValue={domain.dkim_selector ?? ''} />
                                    </Field>
                                    <Field label={t('DKIM record')} className="md:col-span-2">
                                        <Input name="dkim_record" defaultValue={domain.dkim_record ?? ''} />
                                    </Field>
                                    <Field label={t('DMARC record')} className="md:col-span-2">
                                        <Input name="dmarc_record" defaultValue={domain.dmarc_record ?? ''} />
                                    </Field>
                                    <Field label={t('Notes')} className="md:col-span-2">
                                        <Input name="notes" defaultValue={domain.notes ?? ''} />
                                    </Field>
                                    <div>
                                        <Button disabled={processing} size="sm">
                                            {t('Save records')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

DomainsIndex.layout = {
    breadcrumbs: [{ title: t('Domains'), href: '/outbound/domains' }],
};
