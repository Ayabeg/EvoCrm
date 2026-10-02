import { useState } from 'react';
import type { ReactNode } from 'react';
import { Field } from '@/evo/outbound/section';
import type { TemplateRow } from '@/evo/outbound/types';
import { Input } from '@/evo/ui/input';
import { LazyRichTextEditor } from '@/evo/ui/rich-text-editor.lazy';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

export type TemplateEditorProps = {
    template?: Pick<TemplateRow, 'name' | 'subject' | 'body' | 'body_html'>;
    actions?: ReactNode;
    preview?: ReactNode;
};

export function TemplateEditor({ template, actions, preview }: TemplateEditorProps) {
    const [html, setHtml] = useState(template?.body_html ?? '');

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
                <Field label={t('Name')}>
                    <Input name="name" required defaultValue={template?.name ?? ''} />
                </Field>
                <Field label={t('Subject')}>
                    <Input name="subject" defaultValue={template?.subject ?? ''} />
                </Field>
                <Field label={t('Body (text)')}>
                    <Textarea name="body" rows={8} required defaultValue={template?.body ?? ''} />
                </Field>
                <Field label={t('Body (HTML, optional — sent as the HTML part)')}>
                    <LazyRichTextEditor
                        name="body_html"
                        value={html}
                        onChange={(next) => setHtml(next)}
                    />
                </Field>
                {actions}
            </div>
            {preview}
        </div>
    );
}
