import { CaretDown, Check, Plus } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { AGENT_PROFILES } from '@/lib/desk/agent-profiles';
import { useBotDeskStore } from '@/lib/desk/bot-catalog';
import type { BotDefinition } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-primary)]';

type PickerProps = {
    selectedBot: BotDefinition;
    onSelectBot: (bot: BotDefinition) => void;
    onCreateBot: () => void;
};

export function BotPicker({
    selectedBot,
    onSelectBot,
    onCreateBot,
}: PickerProps) {
    const { customBots } = useBotDeskStore();
    const [open, setOpen] = useState(false);
    const [activeOption, setActiveOption] = useState(0);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const options = useMemo(
        () => [...AGENT_PROFILES.map((profile) => profile.bot), ...customBots],
        [customBots],
    );

    function registerOptionRef(index: number, node: HTMLButtonElement | null) {
        optionRefs.current[index] = node;
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        requestAnimationFrame(() => optionRefs.current[0]?.focus());
    }, [open]);

    function closePicker() {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function focusOption(index: number) {
        const next = Math.max(0, Math.min(index, options.length - 1));
        setActiveOption(next);
        optionRefs.current[next]?.focus();
    }

    function selectBot(bot: BotDefinition) {
        onSelectBot(bot);
        closePicker();
    }

    return (
        <div className="relative shrink-0" data-bot-picker>
            <button
                ref={triggerRef}
                type="button"
                className={cn(
                    'inline-flex h-7 max-w-[190px] items-center gap-2 rounded-md px-1.5 text-[12px] font-medium text-[var(--evo-ink)] transition-colors hover:bg-[var(--evo-canvas)] motion-reduce:transition-none',
                    focusRing,
                )}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls="evo-bot-picker-list"
                onClick={() => {
                    if (!open) {
                        setActiveOption(0);
                    }

                    setOpen((current) => !current);
                }}
            >
                <BloubAvatar
                    bot={selectedBot}
                    label={`${selectedBot.name} avatar`}
                    size={18}
                    state="idle"
                />
                <span className="truncate">{selectedBot.name}</span>
                <CaretDown
                    className={cn(
                        'size-3.5 shrink-0 text-[var(--evo-ink)]/55 transition-transform',
                        open && 'rotate-180',
                    )}
                    weight="bold"
                    aria-hidden="true"
                />
            </button>

            {open ? (
                <div
                    className="absolute bottom-[calc(100%+8px)] left-0 z-40 flex max-h-[340px] w-[260px] flex-col overflow-hidden rounded-lg border border-black/10 bg-white text-[var(--evo-ink)] shadow-[0_14px_32px_rgba(13,27,36,0.14)]"
                    data-bot-picker-panel
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-3 py-2.5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--evo-ink)]/55 uppercase">
                                Choose agent
                            </p>
                            <p className="mt-0.5 text-[12px] text-[var(--evo-ink)]/65">
                                One agent per chat
                            </p>
                        </div>
                        <button
                            type="button"
                            className={cn(
                                'grid size-7 place-items-center rounded-md text-[var(--evo-ink)]/55 hover:bg-[var(--evo-canvas)] hover:text-[var(--evo-ink)]',
                                focusRing,
                            )}
                            aria-label="Create a new agent"
                            onClick={() => {
                                closePicker();
                                onCreateBot();
                            }}
                        >
                            <Plus className="size-4" weight="bold" />
                        </button>
                    </div>

                    <div
                        id="evo-bot-picker-list"
                        role="listbox"
                        aria-label="Choose an agent"
                        tabIndex={-1}
                        className="evo-scroll min-h-0 flex-1 overflow-y-auto px-1.5 py-2"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                closePicker();
                            }

                            if (event.key === 'ArrowDown') {
                                event.preventDefault();
                                focusOption(activeOption + 1);
                            }

                            if (event.key === 'ArrowUp') {
                                event.preventDefault();
                                focusOption(activeOption - 1);
                            }

                            if (event.key === 'Home') {
                                event.preventDefault();
                                focusOption(0);
                            }

                            if (event.key === 'End') {
                                event.preventDefault();
                                focusOption(options.length - 1);
                            }
                        }}
                    >
                        <p className="px-2 pb-1 text-[9px] font-semibold tracking-[0.12em] text-[var(--evo-ink)]/45 uppercase">
                            Your agents
                        </p>
                        {AGENT_PROFILES.filter(
                            (profile) => profile.section === 'your',
                        ).map(({ bot }) => (
                            <BotOption
                                key={bot.id}
                                bot={bot}
                                selected={selectedBot.id === bot.id}
                                optionIndex={options.findIndex(
                                    (option) => option.id === bot.id,
                                )}
                                registerOptionRef={registerOptionRef}
                                onFocus={setActiveOption}
                                onSelect={() => selectBot(bot)}
                            />
                        ))}

                        <div
                            className="my-2 flex items-center gap-2 px-2"
                            role="separator"
                        >
                            <span className="h-px flex-1 bg-black/8" />
                            <span className="text-[9px] font-semibold tracking-[0.12em] text-[var(--evo-ink)]/45 uppercase">
                                System
                            </span>
                            <span className="h-px flex-1 bg-black/8" />
                        </div>
                        {AGENT_PROFILES.filter(
                            (profile) => profile.section === 'system',
                        ).map(({ bot }) => (
                            <BotOption
                                key={bot.id}
                                bot={bot}
                                selected={selectedBot.id === bot.id}
                                optionIndex={options.findIndex(
                                    (option) => option.id === bot.id,
                                )}
                                registerOptionRef={registerOptionRef}
                                onFocus={setActiveOption}
                                onSelect={() => selectBot(bot)}
                            />
                        ))}

                        {customBots.length > 0 ? (
                            <div className="mt-2">
                                <div className="my-2 flex items-center gap-2 px-2">
                                    <span className="h-px flex-1 bg-black/8" />
                                    <span className="text-[9px] font-semibold tracking-[0.12em] text-[var(--evo-ink)]/45 uppercase">
                                        Custom
                                    </span>
                                    <span className="h-px flex-1 bg-black/8" />
                                </div>
                                {customBots.map((bot) => (
                                    <BotOption
                                        key={bot.id}
                                        bot={bot}
                                        selected={selectedBot.id === bot.id}
                                        optionIndex={options.findIndex(
                                            (option) => option.id === bot.id,
                                        )}
                                        registerOptionRef={registerOptionRef}
                                        onFocus={setActiveOption}
                                        onSelect={() => selectBot(bot)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        className={cn(
                            'flex h-9 shrink-0 items-center gap-2 border-t border-black/8 px-3 text-[12px] font-medium text-[var(--evo-primary)] hover:bg-[var(--evo-primary)]/[0.05]',
                            focusRing,
                        )}
                        onClick={() => {
                            closePicker();
                            onCreateBot();
                        }}
                    >
                        <Plus className="size-4" weight="bold" />
                        Create a new agent
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function BotOption({
    bot,
    selected,
    optionIndex,
    registerOptionRef,
    onFocus,
    onSelect,
}: {
    bot: BotDefinition;
    selected: boolean;
    optionIndex: number;
    registerOptionRef: (index: number, node: HTMLButtonElement | null) => void;
    onFocus: (index: number) => void;
    onSelect: () => void;
}) {
    return (
        <button
            ref={(node) => registerOptionRef(optionIndex, node)}
            type="button"
            role="option"
            aria-selected={selected}
            className={cn(
                'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] transition-colors hover:bg-[var(--evo-canvas)]',
                selected && 'bg-[var(--evo-teal)]/[0.06]',
                focusRing,
            )}
            onFocus={() => onFocus(optionIndex)}
            onClick={onSelect}
        >
            <BloubAvatar
                bot={bot}
                label={`${bot.name} avatar`}
                size={16}
                state="idle"
            />
            <span className="min-w-0 flex-1 truncate">{bot.name}</span>
            {selected ? (
                <Check
                    className="size-3.5 shrink-0 text-[var(--evo-teal)]"
                    weight="bold"
                />
            ) : null}
        </button>
    );
}
