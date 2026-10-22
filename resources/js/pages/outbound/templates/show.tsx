import { Form, router } from '@inertiajs/react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { OutboundSection } from '@/evo/outbound/section';
import { TemplateEditor } from '@/evo/outbound/TemplateEditor';
import type { TemplateRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

export default function TemplateShow({
    template,
    preview,
}: {
    template: TemplateRow;
    preview: { contact: string; subject?: string | null; html: string };
}) {
    return (
        <OutboundShell title={template.name}>
            <OutboundPage
                title={template.name}
                description={t(
                    'Edit the template and check the rendered preview. Variables: {{first_name}} {{last_name}} {{name}} {{email}} {{phone}} {{company}} {{city}} {{wilaya}} {{unsub}}.',
                )}
                actions={
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (window.confirm(t('Delete template :name?', { name: template.name }))) {
                                router.delete(`/outbound/templates/${template.id}`);
                            }
                        }}
                    >
                        {t('Delete')}
                    </Button>
                }
            >
                <Form action={`/outbound/templates/${template.id}`} method="put">
                    {({ processing }) => (
                        <TemplateEditor
                            template={template}
                            actions={
                                <div>
                                    <Button disabled={processing}>{t('Save template')}</Button>
                                </div>
                            }
                            preview={
                                <OutboundSection title={t('Preview')}>
                                    <p className="mb-3 text-[12px] text-[var(--evo-ink-muted)]">
                                        {t(
                                            'Rendered for :contact. The unsubscribe link points at this CRM host; tracking is off in preview.',
                                            { contact: preview.contact },
                                        )}
                                    </p>
                                    <p className="mb-2 text-[13px]">
                                        <span className="text-[var(--evo-ink-muted)]">{t('Subject')}:</span>{' '}
                                        {preview.subject ?? '—'}
                                    </p>
                                    <iframe
                                        title={t('Rendered email preview')}
                                        className="rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-canvas)] p-4 text-[13px] [&_a]:text-[var(--evo-teal)]"
                                        sandbox=""
                                        srcDoc={preview.html}
                                        style={{ minHeight: 240, width: '100%' }}
                                    />
                                </OutboundSection>
                            }
                        />
                    )}
                </Form>
            </OutboundPage>
        </OutboundShell>
    );
}

TemplateShow.layout = {
    breadcrumbs: [
        { title: t('Templates'), href: '/outbound/templates' },
        { title: t('Template'), href: '#' },
    ],
};
