import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { BotPicker } from '@/components/desk/bot-picker';
import {
    PromptInput,
    PromptInputActions,
    PromptInputTextarea,
} from '@/evo/ai/prompt-input';
import { evoFocus } from '@/evo/ai/types';
import { MagnifyingGlass, PaperPlaneRight, Plus, X } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { isCommandRecordType } from '@/lib/command-os';
import type { CommandSearchHit } from '@/lib/command-os';
import type {
    AgentContextTarget,
    AgentProfile,
    AgentPrompt,
} from '@/lib/desk/agent-profiles';
import type { AgentRecordContext, BotDefinition } from '@/lib/desk/bot-catalog';

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

    function submit() {
        if (!canSend) {
            return;
        }

        onSend(draft.trim(), selectedContext);
        setDraft('');
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
        <PromptInput
            className="relative"
            value={draft}
            onValueChange={setDraft}
            onSubmit={submit}
            isLoading={sending}
            disabled={sending}
            aria-label="Message à l’agent"
            data-agents-composer
        >
            <div className="flex min-h-8 flex-wrap items-center gap-2 px-0.5 pb-2">
                <BotPicker
                    selectedBot={selectedBot}
                    onSelectBot={onSelectBot}
                    onCreateBot={onCreateBot}
                />
                {selectedContext ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-[var(--evo-radius-compact)] bg-evo-teal-soft px-2 py-1 text-[11px] font-medium text-evo-teal">
                        <span className="uppercase">{selectedContext.type}</span>
                        <span className="max-w-[220px] truncate">
                            {selectedContext.label}
                        </span>
                        <button
                            type="button"
                            className={cn(
                                'grid size-4 shrink-0 place-items-center rounded text-evo-teal/70 hover:bg-evo-teal-soft hover:text-evo-teal',
                                evoFocus,
                            )}
                            aria-label={`Retirer le contexte ${selectedContext.label}`}
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
            <PromptInputTextarea
                id="agent-message-input"
                placeholder={profile.placeholder}
                aria-label="Votre message"
                maxLength={240}
                rows={3}
            />

            <PromptInputActions className="mt-1 min-h-9 border-t border-evo-hairline pt-2">
                <div className="flex min-w-0 items-center gap-1">
                    <ComposerToolButton
                        icon={
                            <Plus
                                className="size-3.5"
                                weight="bold"
                                aria-hidden
                            />
                        }
                        label="Joindre"
                        active={panel === 'attach' || Boolean(selectedContext)}
                        onClick={() => togglePanel('attach')}
                    />
                    <ComposerToolButton
                        label="Contexte"
                        active={panel === 'context'}
                        onClick={() => togglePanel('context')}
                    />
                    <ComposerToolButton
                        label="Modèles"
                        active={panel === 'templates'}
                        onClick={() => togglePanel('templates')}
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    disabled={!canSend}
                    aria-label="Envoyer le message"
                    onClick={(event) => {
                        event.stopPropagation();
                        submit();
                    }}
                >
                    {sending ? 'Envoi…' : 'Envoyer'}
                    <PaperPlaneRight
                        className="size-3.5"
                        weight="fill"
                        aria-hidden
                    />
                </Button>
            </PromptInputActions>

            {panel ? (
                <div
                    className="absolute end-0 bottom-[calc(100%+8px)] start-0 z-30 max-h-[300px] overflow-hidden rounded-[var(--evo-radius-standard)] border border-evo-hairline bg-evo-surface text-evo-ink shadow-evo-modal"
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
        </PromptInput>
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
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--evo-radius-compact)] px-2 text-[11px] font-medium transition-colors duration-[var(--evo-duration-micro)] ease-evo motion-reduce:transition-none',
                active
                    ? 'bg-evo-teal-soft text-evo-teal'
                    : 'text-evo-ink-muted hover:bg-evo-surface-subtle hover:text-evo-ink',
                evoFocus,
            )}
            aria-expanded={active}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
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
            <p className="text-[12px] font-semibold">Joindre une fiche CRM</p>
            <p className="mt-0.5 text-[11px] text-evo-ink-muted">
                Recherchez une affaire, un lead, un contact, une entreprise ou un devis.
            </p>
            <label className="relative mt-3 block">
                <MagnifyingGlass
                    className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-evo-ink-muted"
                    weight="regular"
                    aria-hidden
                />
                <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        if (event.key === 'Escape') {
                            event.currentTarget.blur();
                        }

                        if (event.key === 'Enter' && hits[0]) {
                            event.preventDefault();
                            onSelect(hits[0]);
                        }
                    }}
                    placeholder="Rechercher dans le CRM…"
                    aria-label="Rechercher dans le CRM"
                    className={cn(
                        'h-9 w-full rounded-[var(--evo-radius-compact)] border border-evo-hairline bg-evo-canvas pe-3 ps-9 text-[12px] outline-none placeholder:text-evo-ink-faint focus:border-evo-teal',
                        evoFocus,
                    )}
                />
            </label>
            <div className="evo-scroll mt-2 max-h-[150px] overflow-y-auto">
                {searching ? (
                    <p className="px-2 py-2 text-[12px] text-evo-ink-muted">
                        Recherche CRM…
                    </p>
                ) : failed ? (
                    <p className="px-2 py-2 text-[12px] text-evo-danger">
                        La recherche CRM est indisponible pour le moment.
                    </p>
                ) : query.trim().length < 2 ? (
                    <p className="px-2 py-2 text-[12px] text-evo-ink-muted">
                        Saisissez au moins deux caractères.
                    </p>
                ) : hits.length === 0 ? (
                    <p className="px-2 py-2 text-[12px] text-evo-ink-muted">
                        Aucune fiche CRM correspondante.
                    </p>
                ) : (
                    <ul
                        className="space-y-0.5"
                        role="listbox"
                        aria-label="Résultats CRM"
                    >
                        {hits.map((hit) => (
                            <li key={`${hit.type}:${hit.id}`}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={false}
                                    className={cn(
                                        'flex min-h-9 w-full items-center justify-between gap-3 rounded-[var(--evo-radius-compact)] px-2 text-start text-[12px] text-evo-ink hover:bg-evo-surface-subtle',
                                        evoFocus,
                                    )}
                                    onClick={() => onSelect(hit)}
                                >
                                    <span className="min-w-0 truncate font-medium">
                                        {hit.label}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-evo-ink-muted">
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
            <p className="text-[12px] font-semibold">Ouvrir le contexte CRM</p>
            <p className="mt-0.5 text-[11px] text-evo-ink-muted">
                Continuer dans un espace lié à cet agent.
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1">
                {contexts.map((context) => (
                    <li key={context.href}>
                        <Link
                            href={context.href}
                            className={cn(
                                'flex min-h-8 items-center rounded-[var(--evo-radius-compact)] px-2 text-[12px] text-evo-ink hover:bg-evo-surface-subtle',
                                evoFocus,
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
            <p className="text-[12px] font-semibold">Modèles de message</p>
            <ul className="mt-2 space-y-0.5">
                {prompts.map((prompt) => (
                    <li key={prompt.label}>
                        <button
                            type="button"
                            className={cn(
                                'flex min-h-9 w-full items-center gap-2 rounded-[var(--evo-radius-compact)] px-2 text-start text-[12px] text-evo-ink hover:bg-evo-surface-subtle',
                                evoFocus,
                            )}
                            onClick={() => onSelect(prompt)}
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {prompt.label}
                            </span>
                            <span className="text-[10px] text-evo-ink-muted">
                                Utiliser
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
        company: 'Entreprise',
        contact: 'Contact',
        deal: 'Affaire',
        lead: 'Lead',
        quote: 'Devis',
    };

    return labels[type] ?? type;
}
