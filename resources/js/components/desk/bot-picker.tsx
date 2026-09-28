import { Link } from '@inertiajs/react';
import {
    ArrowSquareOut,
    CaretDown,
    Check,
    LinkSimple,
    Plus,
    Robot,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BOT_CATALOG,
    BOT_GROUPS,
    CONNECTORS,
    useBotDeskStore,
} from '@/lib/desk/bot-catalog';
import type {
    BotDefinition,
    ConnectorDefinition,
} from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E]';

type PickerProps = {
    selectedBot: BotDefinition;
    selectedConnectorIds: string[];
    onSelectBot: (bot: BotDefinition) => void;
    onAttachConnector: (connector: ConnectorDefinition) => void;
    onCreateBot: () => void;
};

type PickerOption =
    | { kind: 'bot'; item: BotDefinition }
    | { kind: 'connector'; item: ConnectorDefinition };

export function BotPicker({
    selectedBot,
    selectedConnectorIds,
    onSelectBot,
    onAttachConnector,
    onCreateBot,
}: PickerProps) {
    const { customBots } = useBotDeskStore();
    const [open, setOpen] = useState(false);
    const [activeOption, setActiveOption] = useState(0);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

    function registerOptionRef(index: number, node: HTMLButtonElement | null) {
        optionRefs.current[index] = node;
    }

    const options = useMemo<PickerOption[]>(() => {
        const bots = BOT_GROUPS.flatMap((group) =>
            group.ids
                .map((id) => BOT_CATALOG.find((bot) => bot.id === id))
                .filter((bot): bot is BotDefinition => Boolean(bot)),
        );

        return [
            ...bots.map((item) => ({ kind: 'bot' as const, item })),
            ...customBots.map((item) => ({ kind: 'bot' as const, item })),
            ...CONNECTORS.map((item) => ({ kind: 'connector' as const, item })),
        ];
    }, [customBots]);

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

    function selectOption(option: PickerOption) {
        if (option.kind === 'connector') {
            if (option.item.status === 'coming_soon') {
                return;
            }

            onAttachConnector(option.item);

            return;
        }

        onSelectBot(option.item);
        closePicker();
    }

    return (
        <div className="relative shrink-0" data-bot-picker>
            <button
                ref={triggerRef}
                type="button"
                className={cn(
                    'inline-flex h-8 max-w-[190px] items-center gap-2 rounded-md border border-black/10 bg-white px-2.5 text-[12px] font-medium text-[#0D1B24] transition-colors hover:border-[#0F4C5C]/40 hover:bg-[#F7F8F5]',
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
                <span
                    className={cn(
                        'grid size-5 shrink-0 place-items-center rounded-sm text-[10px] font-semibold',
                        selectedBot.avatarTone === 'orange' &&
                            'bg-[#E8530E]/12 text-[#E8530E]',
                        selectedBot.avatarTone === 'teal' &&
                            'bg-[#0F4C5C]/12 text-[#0F4C5C]',
                        selectedBot.avatarTone === 'night' &&
                            'bg-[#0D1B24] text-white',
                        selectedBot.avatarTone === 'ink' &&
                            'bg-[#0D1B24]/8 text-[#0D1B24]',
                    )}
                    aria-hidden="true"
                >
                    <Robot weight="regular" className="size-3.5" />
                </span>
                <span className="truncate">{selectedBot.name}</span>
                <CaretDown
                    className={cn(
                        'size-3.5 shrink-0 text-[#0D1B24]/55 transition-transform',
                        open && 'rotate-180',
                    )}
                    weight="bold"
                    aria-hidden="true"
                />
            </button>

            {open ? (
                <div
                    className="absolute bottom-[calc(100%+8px)] left-0 z-40 flex h-[360px] w-[280px] flex-col overflow-hidden rounded-lg border border-black/10 bg-white text-[#0D1B24] shadow-[0_14px_32px_rgba(13,27,36,0.14)]"
                    data-bot-picker-panel
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-black/8 px-3 py-2.5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#0D1B24]/55 uppercase">
                                Command with
                            </p>
                            <p className="mt-0.5 text-[12px] text-[#0D1B24]/65">
                                One bot per chat
                            </p>
                        </div>
                        <button
                            type="button"
                            className={cn(
                                'grid size-7 place-items-center rounded-md text-[#0D1B24]/55 hover:bg-[#F7F8F5] hover:text-[#0D1B24]',
                                focusRing,
                            )}
                            aria-label="Create a new Bot"
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
                        aria-label="Bots and connectors"
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
                        {BOT_GROUPS.map((group, groupIndex) => {
                            const groupBots = group.ids
                                .map((id) =>
                                    BOT_CATALOG.find((bot) => bot.id === id),
                                )
                                .filter((bot): bot is BotDefinition =>
                                    Boolean(bot),
                                );

                            return (
                                <div key={group.key}>
                                    {groupIndex > 0 ? (
                                        <div
                                            className="my-2 flex items-center gap-2 px-2"
                                            role="separator"
                                        >
                                            <span className="h-px flex-1 bg-black/8" />
                                            <span className="text-[9px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase">
                                                {group.label}
                                            </span>
                                            <span className="h-px flex-1 bg-black/8" />
                                        </div>
                                    ) : (
                                        <p className="px-2 pb-1 text-[9px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase">
                                            {group.label}
                                        </p>
                                    )}
                                    {groupBots.map((bot) => (
                                        <BotOption
                                            key={bot.id}
                                            bot={bot}
                                            selected={selectedBot.id === bot.id}
                                            optionIndex={options.findIndex(
                                                (option) =>
                                                    option.kind === 'bot' &&
                                                    option.item.id === bot.id,
                                            )}
                                            registerOptionRef={
                                                registerOptionRef
                                            }
                                            onFocus={setActiveOption}
                                            onSelect={() =>
                                                selectOption({
                                                    kind: 'bot',
                                                    item: bot,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            );
                        })}

                        {customBots.length > 0 ? (
                            <div className="mt-2">
                                <div className="my-2 flex items-center gap-2 px-2">
                                    <span className="h-px flex-1 bg-black/8" />
                                    <span className="text-[9px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase">
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
                                            (option) =>
                                                option.kind === 'bot' &&
                                                option.item.id === bot.id,
                                        )}
                                        registerOptionRef={registerOptionRef}
                                        onFocus={setActiveOption}
                                        onSelect={() =>
                                            selectOption({
                                                kind: 'bot',
                                                item: bot,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        ) : null}

                        <div className="my-3 flex items-center gap-2 px-2">
                            <span className="h-px flex-1 bg-black/8" />
                            <span className="text-[9px] font-semibold tracking-[0.12em] text-[#0D1B24]/45 uppercase">
                                Connectors
                            </span>
                            <span className="h-px flex-1 bg-black/8" />
                        </div>

                        {CONNECTORS.map((connector) => (
                            <ConnectorOption
                                key={connector.id}
                                connector={connector}
                                selected={selectedConnectorIds.includes(
                                    connector.id,
                                )}
                                optionIndex={options.findIndex(
                                    (option) =>
                                        option.kind === 'connector' &&
                                        option.item.id === connector.id,
                                )}
                                registerOptionRef={registerOptionRef}
                                onFocus={setActiveOption}
                                onSelect={() =>
                                    selectOption({
                                        kind: 'connector',
                                        item: connector,
                                    })
                                }
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        className={cn(
                            'flex h-9 shrink-0 items-center gap-2 border-t border-black/8 px-3 text-[12px] font-medium text-[#E8530E] hover:bg-[#E8530E]/[0.05]',
                            focusRing,
                        )}
                        onClick={() => {
                            closePicker();
                            onCreateBot();
                        }}
                    >
                        <Plus className="size-4" weight="bold" />
                        Create a new Bot
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
                'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] transition-colors hover:bg-[#F7F8F5]',
                selected && 'bg-[#0F4C5C]/[0.06]',
                focusRing,
            )}
            onFocus={() => onFocus(optionIndex)}
            onClick={onSelect}
        >
            <BotMark tone={bot.avatarTone} />
            <span className="min-w-0 flex-1 truncate">{bot.name}</span>
            {selected ? (
                <Check
                    className="size-3.5 shrink-0 text-[#0F4C5C]"
                    weight="bold"
                />
            ) : null}
        </button>
    );
}

function ConnectorOption({
    connector,
    selected,
    optionIndex,
    registerOptionRef,
    onFocus,
    onSelect,
}: {
    connector: ConnectorDefinition;
    selected: boolean;
    optionIndex: number;
    registerOptionRef: (index: number, node: HTMLButtonElement | null) => void;
    onFocus: (index: number) => void;
    onSelect: () => void;
}) {
    const disabled = connector.status === 'coming_soon';

    return (
        <div className="flex items-center gap-1">
            <button
                ref={(node) => registerOptionRef(optionIndex, node)}
                type="button"
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                disabled={disabled}
                className={cn(
                    'flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-[12px] transition-colors hover:bg-[#F7F8F5] disabled:cursor-not-allowed disabled:opacity-45',
                    selected && 'bg-[#0F4C5C]/[0.06]',
                    focusRing,
                )}
                onFocus={() => onFocus(optionIndex)}
                onClick={onSelect}
            >
                <span className="grid size-5 shrink-0 place-items-center rounded-sm bg-[#F7F8F5] text-[#0D1B24]/60">
                    <LinkSimple className="size-3.5" weight="regular" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                    {connector.name}
                </span>
                {selected ? (
                    <Check
                        className="size-3.5 shrink-0 text-[#0F4C5C]"
                        weight="bold"
                    />
                ) : disabled ? (
                    <span className="shrink-0 text-[10px] text-[#0D1B24]/45">
                        Coming soon
                    </span>
                ) : null}
            </button>
            {connector.href ? (
                <Link
                    href={connector.href}
                    className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-md text-[#0D1B24]/45 hover:bg-[#F7F8F5] hover:text-[#0D1B24]',
                        focusRing,
                    )}
                    aria-label={`Open ${connector.name} settings`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <ArrowSquareOut className="size-3.5" weight="regular" />
                </Link>
            ) : null}
        </div>
    );
}

function BotMark({ tone }: { tone: BotDefinition['avatarTone'] }) {
    return (
        <span
            className={cn(
                'grid size-5 shrink-0 place-items-center rounded-sm text-[10px]',
                tone === 'orange' && 'bg-[#E8530E]/12 text-[#E8530E]',
                tone === 'teal' && 'bg-[#0F4C5C]/12 text-[#0F4C5C]',
                tone === 'night' && 'bg-[#0D1B24] text-white',
                tone === 'ink' && 'bg-[#0D1B24]/8 text-[#0D1B24]',
            )}
            aria-hidden="true"
        >
            <Robot className="size-3.5" weight="regular" />
        </span>
    );
}
