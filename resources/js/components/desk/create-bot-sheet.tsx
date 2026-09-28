import { X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createCustomBot } from '@/lib/desk/bot-catalog';
import type { AvatarTone, BotDefinition } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const TOOLS = ['CRM context', 'WhatsApp threads', 'Meetings'];
const TONES: AvatarTone[] = ['ink', 'teal', 'orange', 'night'];
const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

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
            setError('Give this bot a name before saving.');
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
            className="fixed inset-0 z-50 flex items-end justify-end bg-[#0D1B24]/25 p-3 sm:p-6"
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
                className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[430px] overflow-y-auto rounded-xl border border-black/10 bg-white shadow-[0_24px_60px_rgba(13,27,36,0.2)] sm:max-h-[calc(100dvh-3rem)]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-black/8 px-5 py-4">
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#E8530E] uppercase">
                            Custom bot
                        </p>
                        <h2
                            id="create-bot-title"
                            className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#0D1B24]"
                        >
                            Create a new Bot
                        </h2>
                        <p
                            id="create-bot-description"
                            className="mt-1 max-w-[320px] text-[12px] leading-5 text-[#0D1B24]/58"
                        >
                            Give a focused operator a clear job. This stays
                            local to this desk for now.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={cn(
                            'grid size-8 place-items-center rounded-md text-[#0D1B24]/48 hover:bg-[#F7F8F5] hover:text-[#0D1B24]',
                            focusRing,
                        )}
                        aria-label="Close create bot"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="size-4" weight="bold" />
                    </button>
                </div>

                <form className="space-y-5 px-5 py-5" onSubmit={submit}>
                    <div>
                        <label
                            htmlFor="create-bot-name"
                            className="text-[11px] font-semibold text-[#0D1B24]"
                        >
                            Name
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
                                'mt-1.5 h-9 w-full rounded-md border border-black/12 bg-[#F7F8F5] px-3 text-[13px] text-[#0D1B24] outline-none placeholder:text-[#0D1B24]/35',
                                focusRing,
                            )}
                            placeholder="e.g. Renewal scout"
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
                                className="mt-1.5 text-[11px] text-[#C9480B]"
                            >
                                {error}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="create-bot-instructions"
                            className="text-[11px] font-semibold text-[#0D1B24]"
                        >
                            Instructions
                        </label>
                        <textarea
                            id="create-bot-instructions"
                            value={instructions}
                            onChange={(event) =>
                                setInstructions(event.target.value)
                            }
                            className={cn(
                                'mt-1.5 min-h-[92px] w-full resize-y rounded-md border border-black/12 bg-[#F7F8F5] px-3 py-2.5 text-[13px] leading-5 text-[#0D1B24] outline-none placeholder:text-[#0D1B24]/35',
                                focusRing,
                            )}
                            placeholder="What should it notice, protect, or prepare?"
                        />
                    </div>

                    <fieldset>
                        <legend className="text-[11px] font-semibold text-[#0D1B24]">
                            Tools
                        </legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            {TOOLS.map((tool) => {
                                const checked = tools.includes(tool);

                                return (
                                    <label
                                        key={tool}
                                        className={cn(
                                            'flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-[11px] transition-colors',
                                            checked
                                                ? 'border-[#0F4C5C]/25 bg-[#0F4C5C]/[0.06] text-[#0F4C5C]'
                                                : 'border-black/10 text-[#0D1B24]/62 hover:bg-[#F7F8F5]',
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="size-3.5 accent-[#E8530E]"
                                            checked={checked}
                                            onChange={() => toggleTool(tool)}
                                        />
                                        {tool}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div>
                        <label
                            htmlFor="create-bot-avatar-tone"
                            className="text-[11px] font-semibold text-[#0D1B24]"
                        >
                            Avatar tone
                        </label>
                        <select
                            id="create-bot-avatar-tone"
                            value={avatarTone}
                            onChange={(event) =>
                                setAvatarTone(event.target.value as AvatarTone)
                            }
                            className={cn(
                                'mt-1.5 h-9 w-full rounded-md border border-black/12 bg-[#F7F8F5] px-3 text-[13px] text-[#0D1B24] outline-none',
                                focusRing,
                            )}
                        >
                            {TONES.map((tone) => (
                                <option key={tone} value={tone}>
                                    {tone}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-black/8 pt-4">
                        <button
                            type="button"
                            className={cn(
                                'h-9 rounded-md px-3 text-[12px] font-medium text-[#0D1B24]/62 hover:bg-[#F7F8F5] hover:text-[#0D1B24]',
                                focusRing,
                            )}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={cn(
                                'h-9 rounded-md bg-[#E8530E] px-3.5 text-[12px] font-semibold text-white hover:bg-[#C9480B]',
                                focusRing,
                            )}
                        >
                            Save bot
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
