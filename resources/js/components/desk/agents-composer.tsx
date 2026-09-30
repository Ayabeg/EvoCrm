import { Link } from '@inertiajs/react';
import {
    MagnifyingGlass,
    PaperPlaneRight,
    Plus,
    X,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { ReactNode, RefObject } from 'react';
import { BotPicker } from '@/components/desk/bot-picker';
import { isCommandRecordType } from '@/lib/command-os';
import type { CommandSearchHit } from '@/lib/command-os';
import type {
    AgentContextTarget,
    AgentProfile,
    AgentPrompt,
} from '@/lib/desk/agent-profiles';
import type { AgentRecordContext, BotDefinition } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EC6025]';

type AgentComposerProps = {
    selectedBot: BotDefinition;
    profile: AgentProfile;
    selectedContext: AgentRecordContext | null;
    sending?: boolean;
    onSelectBot: (bot: BotDefinition) => void;
    onSelectContext: (context: AgentRecordContext | null) => void;
    onCreateBot: () => void;
    onSend: (prompt: string, context: AgentRecordContext | null) => void;
};

type ComposerPanel = 'attach' | 'context' | 'templates' | null;

export function AgentsComposer({
    selectedBot,
    profile,
    selectedContext,
    sending = false,
    onSelectBot,
    onSelectContext,
    onCreateBot,
    onSend,
}: AgentComposerProps) {
    const [draft, setDraft] = useState('');
    const [panel, setPanel] = useState<ComposerPanel>(null);
    const [recordQuery, setRecordQuery] = useState('');
    const [recordHits, setRecordHits] = useState<AgentRecordContext[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchFailed, setSearchFailed] = useState(false);
    const recordSearchRef = useRef<HTMLInputElement>(null);
    const canSend = draft.trim().length > 0 && !sending;

    useEffect(() => {
        if (panel === 'attach') {
            requestAnimationFrame(() => recordSearchRef.current?.focus());
        }
    }, [panel]);

    useEffect(() => {
        const needle = recordQuery.trim();

        if (panel !== 'attach' || needle.length < 2) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setSearching(true);
            setSearchFailed(false);

            void fetch(`/crm/command/search?q=${encodeURIComponent(needle)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                signal: controller.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error('CRM search unavailable');
                    }

                    return (await response.json()) as {
                        hits?: CommandSearchHit[];
                    };
                })
                .then((payload) => {
                    setRecordHits(
                        (Array.isArray(payload.hits) ? payload.hits : [])
                            .map(toRecordContext)
                            .filter(
                                (hit): hit is AgentRecordContext =>
                                    hit !== null,
                            ),
                    );
                    setSearching(false);
                })
                .catch((error: unknown) => {
                    if (
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    ) {
                        return;
                    }

                    setRecordHits([]);
                    setSearching(false);
                    setSearchFailed(true);
                });
        }, 180);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [panel, recordQuery]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSend) {
            return;
        }

        onSend(draft.trim(), selectedContext);
        setDraft('');
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    }

    function togglePanel(next: Exclude<ComposerPanel, null>) {
        if (panel === next) {
            closePanel();

            return;
        }

        if (next === 'attach') {
            resetRecordSearch();
        }

        setPanel(next);
    }

    function resetRecordSearch() {
        setRecordQuery('');
        setRecordHits([]);
        setSearching(false);
        setSearchFailed(false);
    }

    function closePanel() {
        setPanel(null);
        resetRecordSearch();
    }

    function handleRecordQueryChange(value: string) {
        setRecordQuery(value);

        if (value.trim().length < 2) {
            setRecordHits([]);
            setSearching(false);
            setSearchFailed(false);
        }
    }

    function useTemplate(template: AgentPrompt) {
        setDraft(template.prompt);
        closePanel();
    }

    return (
        <form
            className="relative rounded-xl border border-[#E6E8E3] bg-white p-3"
            aria-label="Message à l’agent"
            data-agents-composer
            onSubmit={submit}
        >
            <div className="flex min-h-8 flex-wrap items-center gap-2 px-0.5 pb-2">
                <BotPicker
                    selectedBot={selectedBot}
                    onSelectBot={onSelectBot}
                    onCreateBot={onCreateBot}
                />
                {selectedContext ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#0F4C5C]/[0.07] px-2 py-1 text-[11px] font-medium text-[#0F4C5C]">
                        <span className="uppercase">
                            {selectedContext.type}
                        </span>
                        <span className="max-w-[220px] truncate">
                            {selectedContext.label}
                        </span>
                        <button
                            type="button"
                            className={cn(
                                'grid size-4 shrink-0 place-items-center rounded text-[#0F4C5C]/70 hover:bg-[#0F4C5C]/10 hover:text-[#0F4C5C]',
                                focusRing,
                            )}
                            aria-label={`Remove ${selectedContext.label} context`}
                            onClick={() => onSelectContext(null)}
                        >
                            <X className="size-3" weight="bold" aria-hidden />
                        </button>
                    </span>
                ) : null}
            </div>

            <label className="sr-only" htmlFor="agent-message-input">
                Votre message
            </label>
            <textarea
                id="agent-message-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                    'block min-h-[72px] w-full resize-none border-0 bg-transparent px-1 py-1.5 text-[13px] leading-5 text-[#0D1B24] outline-none placeholder:text-[#69777C]',
                    focusRing,
                )}
                placeholder={profile.placeholder}
                aria-label="Votre message"
                maxLength={240}
                rows={3}
            />

            <div className="mt-1 flex min-h-9 items-center justify-between gap-2 border-t border-[#E6E8E3] pt-2">
                <div className="flex min-w-0 items-center gap-1">
                    <ComposerToolButton
                        icon={
                            <Plus
                                className="size-3.5"
                                weight="bold"
                                aria-hidden
                            />
                        }
                        label="Attach"
                        active={panel === 'attach' || Boolean(selectedContext)}
                        onClick={() => togglePanel('attach')}
                    />
                    <ComposerToolButton
                        label="Context"
                        active={panel === 'context'}
                        onClick={() => togglePanel('context')}
                    />
                    <ComposerToolButton
                        label="Templates"
                        active={panel === 'templates'}
                        onClick={() => togglePanel('templates')}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed',
                        canSend
                            ? 'bg-[#EC6025] text-white hover:bg-[#D8511E]'
                            : 'bg-[#E8EBE7] text-[#6B777B]',
                        focusRing,
                    )}
                    aria-label="Send message"
                >
                    {sending ? 'Sending…' : 'Send'}
                    <PaperPlaneRight
                        className="size-3.5"
                        weight="fill"
                        aria-hidden
                    />
                </button>
            </div>

            {panel ? (
                <div
                    className="absolute right-0 bottom-[calc(100%+8px)] left-0 z-30 max-h-[300px] overflow-hidden rounded-lg border border-[#E6E8E3] bg-white text-[#0D1B24] shadow-[0_12px_30px_rgba(13,27,36,0.1)]"
                    data-agents-composer-panel={panel}
                >
                    {panel === 'attach' ? (
                        <RecordSearchPanel
                            query={recordQuery}
                            hits={recordHits}
                            searching={searching}
                            failed={searchFailed}
                            searchRef={recordSearchRef}
                            onQueryChange={handleRecordQueryChange}
                            onSelect={(context) => {
                                onSelectContext(context);
                                closePanel();
                            }}
                        />
                    ) : null}
                    {panel === 'context' ? (
                        <ContextPanel
                            contexts={profile.contexts}
                            onNavigate={closePanel}
                        />
                    ) : null}
                    {panel === 'templates' ? (
                        <TemplatesPanel
                            prompts={profile.prompts}
                            onSelect={useTemplate}
                        />
                    ) : null}
                </div>
            ) : null}
        </form>
    );
}

function ComposerToolButton({
    icon,
    label,
    active,
    onClick,
}: {
    icon?: ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors motion-reduce:transition-none',
                active
                    ? 'bg-[#0F4C5C]/[0.08] text-[#0F4C5C]'
                    : 'text-[#59686F] hover:bg-[#F3F5F1] hover:text-[#0D1B24]',
                focusRing,
            )}
            aria-expanded={active}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    );
}

function RecordSearchPanel({
    query,
    hits,
    searching,
    failed,
    searchRef,
    onQueryChange,
    onSelect,
}: {
    query: string;
    hits: AgentRecordContext[];
    searching: boolean;
    failed: boolean;
    searchRef: RefObject<HTMLInputElement | null>;
    onQueryChange: (query: string) => void;
    onSelect: (context: AgentRecordContext) => void;
}) {
    return (
        <div className="p-3">
            <p className="text-[12px] font-semibold">Attach a CRM record</p>
            <p className="mt-0.5 text-[11px] text-[#69777C]">
                Search deals, leads, contacts, companies, or quotes.
            </p>
            <label className="relative mt-3 block">
                <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#69777C]"
                    weight="regular"
                    aria-hidden
                />
                <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.currentTarget.blur();
                        }

                        if (event.key === 'Enter' && hits[0]) {
                            event.preventDefault();
                            onSelect(hits[0]);
                        }
                    }}
                    placeholder="Search CRM records..."
                    aria-label="Search CRM records"
                    className={cn(
                        'h-9 w-full rounded-md border border-[#E6E8E3] bg-[#F7F8F5] pr-3 pl-9 text-[12px] outline-none placeholder:text-[#7A8589] focus:border-[#0F4C5C]/45',
                        focusRing,
                    )}
                />
            </label>
            <div className="evo-scroll mt-2 max-h-[150px] overflow-y-auto">
                {searching ? (
                    <p className="px-2 py-2 text-[12px] text-[#69777C]">
                        Searching CRM…
                    </p>
                ) : failed ? (
                    <p className="px-2 py-2 text-[12px] text-[#9C3F28]">
                        CRM search is unavailable right now.
                    </p>
                ) : query.trim().length < 2 ? (
                    <p className="px-2 py-2 text-[12px] text-[#69777C]">
                        Enter at least two characters.
                    </p>
                ) : hits.length === 0 ? (
                    <p className="px-2 py-2 text-[12px] text-[#69777C]">
                        No matching CRM records.
                    </p>
                ) : (
                    <ul
                        className="space-y-0.5"
                        role="listbox"
                        aria-label="CRM search results"
                    >
                        {hits.map((hit) => (
                            <li key={`${hit.type}:${hit.id}`}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={false}
                                    className={cn(
                                        'flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-[12px] text-[#0D1B24] hover:bg-[#F3F5F1]',
                                        focusRing,
                                    )}
                                    onClick={() => onSelect(hit)}
                                >
                                    <span className="min-w-0 truncate font-medium">
                                        {hit.label}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-[#69777C]">
                                        {recordTypeLabel(hit.type)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ContextPanel({
    contexts,
    onNavigate,
}: {
    contexts: AgentContextTarget[];
    onNavigate: () => void;
}) {
    return (
        <div className="p-3">
            <p className="text-[12px] font-semibold">Open CRM context</p>
            <p className="mt-0.5 text-[11px] text-[#69777C]">
                Continue in a workspace linked to this agent.
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1">
                {contexts.map((context) => (
                    <li key={context.href}>
                        <Link
                            href={context.href}
                            className={cn(
                                'flex min-h-8 items-center rounded-md px-2 text-[12px] text-[#0D1B24] hover:bg-[#F3F5F1]',
                                focusRing,
                            )}
                            onClick={onNavigate}
                        >
                            {context.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TemplatesPanel({
    prompts,
    onSelect,
}: {
    prompts: AgentPrompt[];
    onSelect: (prompt: AgentPrompt) => void;
}) {
    return (
        <div className="p-3">
            <p className="text-[12px] font-semibold">Message templates</p>
            <ul className="mt-2 space-y-0.5">
                {prompts.map((prompt) => (
                    <li key={prompt.label}>
                        <button
                            type="button"
                            className={cn(
                                'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[12px] text-[#0D1B24] hover:bg-[#F3F5F1]',
                                focusRing,
                            )}
                            onClick={() => onSelect(prompt)}
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {prompt.label}
                            </span>
                            <span className="text-[10px] text-[#69777C]">
                                Use
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function toRecordContext(hit: CommandSearchHit): AgentRecordContext | null {
    const type = hit.recordRef?.type ?? hit.type;
    const id = hit.recordRef?.id ?? hit.id;

    if (
        !isCommandRecordType(type) ||
        !Number.isInteger(id) ||
        id < 1 ||
        !hit.href.startsWith('/') ||
        hit.href.startsWith('//')
    ) {
        return null;
    }

    return {
        type,
        id,
        label: hit.label,
        href: hit.href,
    };
}

function recordTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        company: 'Company',
        contact: 'Contact',
        deal: 'Deal',
        lead: 'Lead',
        quote: 'Quote',
    };

    return labels[type] ?? type;
}
