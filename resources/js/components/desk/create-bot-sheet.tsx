import { X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { createCustomBot } from '@/lib/desk/bot-catalog';
import type { AvatarTone, BotDefinition } from '@/lib/desk/bot-catalog';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TOOLS = ['CRM context', 'WhatsApp threads', 'Meetings'] as const;
const TONES: AvatarTone[] = ['ink', 'teal', 'orange', 'night'];
const TONE_LABELS: Record<AvatarTone, string> = {
    ink: 'Encre',
    teal: 'Sarcelle',
    orange: 'Orange',
    night: 'Nuit',
};
const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]';

type CreateBotSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (bot: BotDefinition) => void;
};

export function CreateBotSheet({
    open,
    onOpenChange,
    onCreated,
}: CreateBotSheetProps) {
    const nameRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [tools, setTools] = useState<string[]>(['CRM context']);
    const [avatarTone, setAvatarTone] = useState<AvatarTone>('ink');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }

        requestAnimationFrame(() => {
            setError('');
            nameRef.current?.focus();
        });

        function handleEscape(event: globalThis.KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onOpenChange(false);
            }
        }

        window.addEventListener('keydown', handleEscape);

        return () => window.removeEventListener('keydown', handleEscape);
    }, [onOpenChange, open]);

    if (!open) {
        return null;
    }

    function toggleTool(tool: string) {
        setTools((current) =>
            current.includes(tool)
                ? current.filter((item) => item !== tool)
                : [...current, tool],
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim()) {
            setError(t('Give this bot a name before saving.'));
            nameRef.current?.focus();

            return;
        }

        const bot = createCustomBot({
            name,
            instructions,
            tools,
            avatarTone,
        });

        onCreated?.(bot);
        setName('');
        setInstructions('');
        setTools(['CRM context']);
        setAvatarTone('ink');
        onOpenChange(false);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-end bg-[color-mix(in_srgb,var(--evo-ink)_25%,transparent)] p-3 sm:p-6"
            data-create-bot-sheet
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onOpenChange(false);
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-bot-title"
                aria-describedby="create-bot-description"
                className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[430px] overflow-y-auto rounded-[var(--evo-radius-floating)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] shadow-[var(--evo-shadow-modal)] sm:max-h-[calc(100dvh-3rem)]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[var(--evo-hairline)] px-5 py-4">
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--evo-primary)] uppercase">
                            {t('Custom bot')}
                        </p>
                        <h2
                            id="create-bot-title"
                            className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--evo-ink)]"
                        >
                            {t('Create a new Bot')}
                        </h2>
                        <p
                            id="create-bot-description"
                            className="mt-1 max-w-[320px] text-[12px] leading-5 text-[var(--evo-ink-secondary)]"
                        >
                            {t(
                                'Give a focused operator a clear job. This stays local to this desk for now.',
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        className={cn(
                            'grid size-8 place-items-center rounded-[var(--evo-radius-compact)] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-canvas)] hover:text-[var(--evo-ink)]',
                            focusRing,
                        )}
                        aria-label={t('Close create bot')}
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="size-4" weight="bold" />
                    </button>
                </div>

                <form className="space-y-5 px-5 py-5" onSubmit={submit}>
                    <div>
                        <label
                            htmlFor="create-bot-name"
                            className="text-[11px] font-semibold text-[var(--evo-ink)]"
                        >
                            {t('Name')}
                        </label>
                        <input
                            ref={nameRef}
                            id="create-bot-name"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setError('');
                            }}
                            className={cn(
                                'mt-1.5 h-9 w-full rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-canvas)] px-3 text-[13px] text-[var(--evo-ink)] outline-none placeholder:text-[var(--evo-ink-faint)]',
                                focusRing,
                            )}
                            placeholder={t('e.g. Renewal scout')}
                            autoComplete="off"
                            aria-invalid={Boolean(error)}
                            aria-describedby={
                                error ? 'create-bot-error' : undefined
                            }
                        />
                        {error ? (
                            <p
                                id="create-bot-error"
                                role="alert"
                                className="mt-1.5 text-[11px] text-[var(--evo-danger)]"
                            >
                                {error}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="create-bot-instructions"
                            className="text-[11px] font-semibold text-[var(--evo-ink)]"
                        >
                            {t('Instructions')}
                        </label>
                        <textarea
                            id="create-bot-instructions"
                            value={instructions}
                            onChange={(event) =>
                                setInstructions(event.target.value)
                            }
                            className={cn(
                                'mt-1.5 min-h-[92px] w-full resize-y rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-canvas)] px-3 py-2.5 text-[13px] leading-5 text-[var(--evo-ink)] outline-none placeholder:text-[var(--evo-ink-faint)]',
                                focusRing,
                            )}
                            placeholder={t(
                                'What should it notice, protect, or prepare?',
                            )}
                        />
                    </div>

                    <fieldset>
                        <legend className="text-[11px] font-semibold text-[var(--evo-ink)]">
                            {t('Tools')}
                        </legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            {TOOLS.map((tool) => {
                                const checked = tools.includes(tool);

                                return (
                                    <label
                                        key={tool}
                                        className={cn(
                                            'flex min-h-9 cursor-pointer items-center gap-2 rounded-[var(--evo-radius-compact)] border px-2.5 text-[11px] transition-colors',
                                            checked
                                                ? 'border-[var(--evo-teal-line)] bg-[var(--evo-teal-soft)] text-[var(--evo-teal)]'
                                                : 'border-[var(--evo-hairline)] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-canvas)]',
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="size-3.5 accent-[var(--evo-primary)]"
                                            checked={checked}
                                            onChange={() => toggleTool(tool)}
                                        />
                                        {t(tool)}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div>
                        <label
                            htmlFor="create-bot-avatar-tone"
                            className="text-[11px] font-semibold text-[var(--evo-ink)]"
                        >
                            {t('Avatar')}
                        </label>
                        <div className="mt-1.5 flex items-center gap-3">
                            <BloubAvatar
                                bot={{
                                    id: `custom-preview-${name.trim() || 'draft'}`,
                                    name: name.trim() || t('Custom bot'),
                                    avatarTone,
                                    avatarType: undefined,
                                    custom: true,
                                }}
                                label={t('Custom bot avatar preview')}
                                size={28}
                                state="idle"
                            />
                            <select
                                id="create-bot-avatar-tone"
                                value={avatarTone}
                                onChange={(event) =>
                                    setAvatarTone(
                                        event.target.value as AvatarTone,
                                    )
                                }
                                className={cn(
                                    'h-9 min-w-0 flex-1 rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline-strong)] bg-[var(--evo-canvas)] px-3 text-[13px] text-[var(--evo-ink)] outline-none',
                                    focusRing,
                                )}
                            >
                                {TONES.map((tone) => (
                                    <option key={tone} value={tone}>
                                        {TONE_LABELS[tone]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-[var(--evo-hairline)] pt-4">
                        <button
                            type="button"
                            className={cn(
                                'h-9 rounded-[var(--evo-radius-compact)] px-3 text-[12px] font-medium text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-canvas)] hover:text-[var(--evo-ink)]',
                                focusRing,
                            )}
                            onClick={() => onOpenChange(false)}
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            className={cn(
                                'h-9 rounded-[var(--evo-radius-compact)] bg-[var(--evo-primary)] px-3.5 text-[12px] font-semibold text-[var(--evo-on-primary)] hover:bg-[var(--evo-primary-hover)]',
                                focusRing,
                            )}
                        >
                            {t('Save bot')}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
