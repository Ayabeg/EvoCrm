import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Paperclip, PaperPlaneTilt } from '@/evo/icons';
import { Attachment } from '@/evo/inbox/Attachment';
import { templatesForChannel } from '@/evo/inbox/canned';
import type {
    InboxAttachment,
    InboxComposeMode,
    InboxComposerSubmit,
    InboxTemplate,
} from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { Kbd } from '@/evo/ui/kbd';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/evo/ui/popover';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

export function Composer({
    threadId,
    mode,
    onModeChange,
    channel,
    templates,
    action,
    onSubmit,
    allowResolve = true,
    defaultPickerOpen = false,
    className,
}: {
    threadId?: string | number;
    mode: InboxComposeMode;
    onModeChange: (mode: InboxComposeMode) => void;
    channel?: string | null;
    templates?: InboxTemplate[];
    action?: string;
    onSubmit?: (payload: InboxComposerSubmit) => void;
    allowResolve?: boolean;
    defaultPickerOpen?: boolean;
    className?: string;
}) {
    const [body, setBody] = useState('');
    const [files, setFiles] = useState<InboxAttachment[]>([]);
    const [pickerOpen, setPickerOpen] = useState(defaultPickerOpen);
    const fileRef = useRef<HTMLInputElement>(null);
    const textRef = useRef<HTMLTextAreaElement>(null);
    const catalog = templatesForChannel(channel, templates);

    const applyTemplate = (template: InboxTemplate) => {
        setBody(template.body);

        if (textRef.current) {
            textRef.current.value = template.body;
        }

        setPickerOpen(false);
    };

    const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Array.from(event.target.files ?? []).map((file, index) => ({
            id: `${file.name}-${file.size}-${index}`,
            name: file.name,
            size: file.size,
            mime: file.type,
        }));
        setFiles((current) => [...current, ...next]);
        event.target.value = '';
    };

    const submitPayload = (resolve = false): InboxComposerSubmit => ({
        body: body.trim(),
        mode,
        resolve,
        attachments: files,
    });

    const handleLocalSubmit = (event: FormEvent, resolve = false) => {
        if (!onSubmit) {
            return;
        }

        event.preventDefault();

        if (body.trim() === '') {
            return;
        }

        onSubmit(submitPayload(resolve));
        setBody('');
        setFiles([]);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    };

    const fields = (processing: boolean, errors?: { body?: string }) => (
        <div
            className={cn(
                'border-t border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-3',
                className,
            )}
        >
            <div className="mb-2 flex gap-3" role="group" aria-label={t('Compose')}>
                <button
                    type="button"
                    onClick={() => onModeChange('reply')}
                    aria-pressed={mode === 'reply'}
                    className={
                        mode === 'reply'
                            ? 'border-b-2 border-[var(--evo-teal)] pb-0.5 text-[12px] font-medium text-[var(--evo-ink)]'
                            : 'text-[12px] text-[var(--evo-ink-muted)]'
                    }
                >
                    {t('Reply')}
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange('note')}
                    aria-pressed={mode === 'note'}
                    className={
                        mode === 'note'
                            ? 'border-b-2 border-[var(--evo-teal)] pb-0.5 text-[12px] font-medium text-[var(--evo-ink)]'
                            : 'text-[12px] text-[var(--evo-ink-muted)]'
                    }
                >
                    {t('Note')}
                </button>
            </div>
            {mode === 'note' && action ? (
                <input type="hidden" name="as_note" value="1" />
            ) : null}
            <Textarea
                ref={textRef}
                name="body"
                required
                value={action ? undefined : body}
                defaultValue={action ? undefined : undefined}
                onChange={(event) => setBody(event.target.value)}
                aria-label={
                    mode === 'note' ? t('Private note') : t('Type your message')
                }
                placeholder={
                    mode === 'note' ? t('Private note') : t('Type your message')
                }
                className="max-h-32 min-h-16"
                onKeyDown={onKeyDown}
            />
            {errors?.body ? (
                <p role="alert" className="mt-1 text-[12px] text-[var(--evo-danger)]">
                    {errors.body}
                </p>
            ) : null}
            {files.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {files.map((file) => (
                        <Attachment
                            key={file.id}
                            file={file}
                            onRemove={() =>
                                setFiles((current) => current.filter((item) => item.id !== file.id))
                            }
                        />
                    ))}
                </div>
            ) : null}
            <div className="mt-2 flex flex-nowrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
                    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                {t('Insert template')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 p-2">
                            <p className="px-2 py-1 text-[11px] font-medium text-[var(--evo-ink-muted)] uppercase">
                                {t('Canned responses')}
                            </p>
                            <ul>
                                {catalog
                                    .filter((item) => item.kind !== 'whatsapp')
                                    .map((template) => (
                                        <li key={template.id}>
                                            <button
                                                type="button"
                                                onClick={() => applyTemplate(template)}
                                                className="w-full rounded-[var(--evo-radius-compact)] px-2 py-1.5 text-start text-[13px] hover:bg-[var(--evo-hover)]"
                                            >
                                                <span className="block font-medium">
                                                    {template.title}
                                                </span>
                                                <span className="block truncate text-[12px] text-[var(--evo-ink-muted)]">
                                                    {template.body}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                            </ul>
                            <p className="mt-2 px-2 py-1 text-[11px] font-medium text-[var(--evo-ink-muted)] uppercase">
                                {t('WhatsApp templates')}
                            </p>
                            <ul>
                                {catalog
                                    .filter((item) => item.kind === 'whatsapp')
                                    .map((template) => (
                                        <li key={template.id}>
                                            <button
                                                type="button"
                                                onClick={() => applyTemplate(template)}
                                                className="w-full rounded-[var(--evo-radius-compact)] px-2 py-1.5 text-start text-[13px] hover:bg-[var(--evo-hover)]"
                                            >
                                                <span className="block font-medium">
                                                    {template.title}
                                                </span>
                                                <span className="block truncate text-[12px] text-[var(--evo-ink-muted)]">
                                                    {template.body}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                            </ul>
                            {catalog.length === 0 ? (
                                <p className="px-2 py-2 text-[13px] text-[var(--evo-ink-muted)]">
                                    {t('No templates')}
                                </p>
                            ) : null}
                        </PopoverContent>
                    </Popover>
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={onFiles}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t('Add attachment')}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Paperclip className="size-3.5" aria-hidden />
                    </Button>
                    <span className="hidden items-center gap-1 text-[11px] text-[var(--evo-ink-muted)] sm:inline-flex">
                        <Kbd>↵</Kbd>
                        <span>{t('Press Enter to send. Shift+Enter for a new line.')}</span>
                    </span>
                </div>
                <div className="flex shrink-0 flex-nowrap justify-end gap-2">
                    {mode === 'reply' ? (
                        <>
                            {allowResolve ? (
                                <Button
                                    type={action ? 'submit' : 'button'}
                                    name="resolve"
                                    value="1"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={
                                        action
                                            ? undefined
                                            : (event) => handleLocalSubmit(event, true)
                                    }
                                >
                                    {t('Send as resolved')}
                                </Button>
                            ) : null}
                            <Button
                                type={action ? 'submit' : 'button'}
                                disabled={processing}
                                onClick={
                                    action ? undefined : (event) => handleLocalSubmit(event)
                                }
                            >
                                <PaperPlaneTilt className="size-3.5" aria-hidden />
                                {t('Send')}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type={action ? 'submit' : 'button'}
                            disabled={processing}
                            onClick={
                                action ? undefined : (event) => handleLocalSubmit(event)
                            }
                        >
                            {t('Add note')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    if (action && threadId != null) {
        return (
            <Form
                key={String(threadId)}
                action={action}
                method="post"
                resetOnSuccess={['body']}
                data-inbox="composer"
            >
                {({ processing, errors }) => fields(processing, errors)}
            </Form>
        );
    }

    return (
        <form
            data-inbox="composer"
            onSubmit={(event) => handleLocalSubmit(event)}
        >
            {fields(false)}
        </form>
    );
}

export function InboxComposer({
    threadId,
    mode,
    onModeChange,
}: {
    threadId: number;
    mode: InboxComposeMode;
    onModeChange: (mode: InboxComposeMode) => void;
}) {
    return (
        <Composer
            threadId={threadId}
            mode={mode}
            onModeChange={onModeChange}
            action={`/desk/threads/${threadId}/reply`}
        />
    );
}
