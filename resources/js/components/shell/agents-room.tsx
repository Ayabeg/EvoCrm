import {
    ArrowUp,
    Bot,
    Calendar,
    FileText,
    Handshake,
    Megaphone,
    MessageCircle,
    Mic,
    Paperclip,
    Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';

const TASKS: { label: string; icon: LucideIcon }[] = [
    { label: 'Draft a follow-up', icon: MessageCircle },
    { label: 'Qualify a lead', icon: Bot },
    { label: 'Book a meeting', icon: Calendar },
    { label: 'Write a quote', icon: FileText },
];

const DESK_ICONS: { name: string; icon: LucideIcon }[] = [
    { name: 'Closer', icon: MessageCircle },
    { name: 'Qualifier', icon: Megaphone },
    { name: 'Quote desk', icon: Calendar },
    { name: 'After-sale', icon: Handshake },
];

const iconButtonClass =
    'grid size-8 place-items-center rounded-[8px] text-shell-muted transition-colors duration-150 hover:bg-shell-teal-soft hover:text-shell-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-teal motion-reduce:transition-none';

export function AgentsRoom() {
    const fieldId = useId();
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    const [draft, setDraft] = useState('');
    const [turns, setTurns] = useState<string[]>([]);
    const [failed, setFailed] = useState(false);
    const canSend = draft.trim() !== '';

    function focusField(value: string) {
        const field = fieldRef.current;

        if (!field) {
            return;
        }

        field.focus();
        field.setSelectionRange(value.length, value.length);
    }

    function fillTask(label: string) {
        setDraft(label);
        setFailed(false);
        requestAnimationFrame(() => focusField(label));
    }

    function send() {
        const value = draft.trim();

        if (value === '') {
            return;
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            setFailed(true);

            return;
        }

        setFailed(false);
        setTurns((current) => [...current, value]);
        setDraft('');
    }

    return (
        <section
            className="evo-agents flex min-h-0 min-w-0 flex-1 flex-col"
            aria-label="Agents"
        >
            <div className="evo-scroll min-h-0 flex-1 overflow-y-auto px-6">
                <div className="flex min-h-full flex-col [justify-content:safe_center] py-8">
                    <div className="mx-auto flex w-full max-w-[720px] flex-col">
                        <h1 className="text-center text-[40px] font-medium tracking-[-0.03em] text-shell-ink">
                            What should we do next?
                        </h1>

                        <form
                            className="mt-6 rounded-[12px] border border-shell-hairline bg-shell-paper p-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-shell-teal"
                            onSubmit={(event) => {
                                event.preventDefault();
                                send();
                            }}
                        >
                            <label className="sr-only" htmlFor={fieldId}>
                                Ask about a deal, a lead, or a WhatsApp thread
                            </label>
                            <textarea
                                ref={fieldRef}
                                id={fieldId}
                                rows={2}
                                value={draft}
                                placeholder="Ask about a deal, a lead, or a WhatsApp thread"
                                className="block w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-[22px] text-shell-ink outline-none placeholder:text-shell-muted"
                                onChange={(event) => {
                                    setDraft(event.target.value);

                                    if (failed) {
                                        setFailed(false);
                                    }
                                }}
                                onFocus={(event) => {
                                    event.currentTarget.scrollIntoView({
                                        block: 'center',
                                    });
                                }}
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        aria-label="Add"
                                    >
                                        <Plus
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        aria-label="Attach"
                                    >
                                        <Paperclip
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        aria-label="Voice"
                                    >
                                        <Mic
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    aria-label="Send"
                                    disabled={!canSend}
                                    className="grid size-8 place-items-center rounded-full bg-shell-ink text-shell-orange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-teal disabled:opacity-40"
                                >
                                    <ArrowUp
                                        className="size-4"
                                        strokeWidth={1.75}
                                    />
                                </button>
                            </div>
                        </form>

                        {failed ? (
                            <p
                                role="alert"
                                className="mt-3 text-[13px] text-shell-ink"
                            >
                                Could not send.{' '}
                                <button
                                    type="button"
                                    className="text-shell-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-teal"
                                    onClick={send}
                                >
                                    Try again
                                </button>
                            </p>
                        ) : null}

                        {turns.length > 0 ? (
                            <div className="mt-3 space-y-3" aria-live="polite">
                                {turns.map((turn, index) => (
                                    <div key={`${index}-${turn}`}>
                                        <p className="text-[13px] text-shell-ink">
                                            {turn}
                                        </p>
                                        <p className="text-[13px] text-shell-muted">
                                            Queued on this desk. No agent has run it yet.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div
                            role="group"
                            aria-label="Tasks"
                            className="mt-3 flex flex-wrap justify-center gap-2"
                        >
                            {TASKS.map((task) => {
                                const Icon = task.icon;

                                return (
                                    <button
                                        key={task.label}
                                        type="button"
                                        className="inline-flex h-9 items-center gap-2 rounded-full border border-shell-hairline bg-shell-paper px-3 text-[13px] text-shell-ink transition-colors duration-150 hover:bg-shell-teal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-teal motion-reduce:transition-none"
                                        onClick={() => fillTask(task.label)}
                                    >
                                        <Icon
                                            className="size-4 shrink-0 text-shell-muted"
                                            strokeWidth={1.75}
                                        />
                                        {task.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-16 flex items-center gap-4 rounded-[12px] border border-shell-hairline bg-shell-paper p-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-[15px] font-semibold text-shell-ink">
                                    Four agents on this workspace.
                                </h2>
                                <p className="mt-1 text-[13px] text-shell-muted">
                                    Closer, Qualifier, Quote desk, After-sale.
                                </p>
                            </div>
                            <div
                                className="flex shrink-0 items-center gap-2"
                                aria-hidden="true"
                            >
                                {DESK_ICONS.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <span
                                            key={item.name}
                                            className="grid size-7 place-items-center rounded-full border border-shell-hairline bg-shell-paper text-shell-teal"
                                        >
                                            <Icon
                                                className="size-4"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
