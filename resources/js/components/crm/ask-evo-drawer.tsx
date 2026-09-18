import { router, usePage } from '@inertiajs/react';
import { Sparkle } from '@phosphor-icons/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import {
    ASK_EVO_OPEN_EVENT,
    askEvoErrorMessage,
    askEvoHeaders,
    askEvoScopeKey,
    contextIndicatorLabel,
    parseAskEvoIdentityFromUrl,
    shouldResetAskEvoScope,
} from '@/lib/ask-evo';
import type {
    AskEvoAskResponse,
    AskEvoContextPayload,
    AskEvoIdentity,
    AskEvoSuggestion,
} from '@/lib/ask-evo';

type Turn = {
    question: string;
    answer: string;
};

export function AskEvoDrawer() {
    const { features } = useSimpleMode();
    const page = usePage();
    const { state: qrd } = useQuickRecord();
    const inputId = useId();
    const statusId = useId();
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [context, setContext] = useState<AskEvoContextPayload | null>(null);
    const [turns, setTurns] = useState<Turn[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const scopeRef = useRef<string | null>(null);
    const openerRef = useRef<HTMLElement | null>(null);

    const qrdType = qrd.open ? qrd.current?.type : null;
    const qrdId = qrd.open ? qrd.current?.id : null;
    const identity: AskEvoIdentity = useMemo(
        () =>
            parseAskEvoIdentityFromUrl(
                page.url,
                qrdType && qrdId ? { type: qrdType, id: qrdId } : null,
            ),
        [page.url, qrdType, qrdId],
    );
    const scope = context?.scope_key ?? askEvoScopeKey(identity);

    useEffect(() => {
        if (shouldResetAskEvoScope(scopeRef.current, scope)) {
            setTurns([]);
            setError(null);
            setQuestion('');
        }

        scopeRef.current = scope;
    }, [scope]);

    useEffect(() => {
        const onOpen = (event: Event) => {
            openerRef.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null;
            setOpen(true);
            const detail = (event as CustomEvent<AskEvoIdentity | null>).detail;
            void loadContext(detail ?? identity);
        };

        window.addEventListener(ASK_EVO_OPEN_EVENT, onOpen);

        return () => window.removeEventListener(ASK_EVO_OPEN_EVENT, onOpen);
    }, [identity]);

    const loadContext = async (next: AskEvoIdentity) => {
        const params = new URLSearchParams();
        params.set('page', next.page);

        if (next.entityType) {
            params.set('entity_type', next.entityType);
        }

        if (next.entityId) {
            params.set('entity_id', String(next.entityId));
        }

        try {
            const response = await fetch(`/ask-evo/context?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            const payload = (await response.json()) as {
                ok?: boolean;
                context?: AskEvoContextPayload;
                error?: { message?: string };
            };

            if (payload.context) {
                setContext(payload.context);
            }

            if (!response.ok) {
                setError(payload.error?.message ?? 'This context is not available.');
            } else {
                setError(null);
            }
        } catch {
            setError('Ask Evo is unavailable.');
        }
    };

    const ask = async (nextQuestion: string) => {
        const trimmed = nextQuestion.trim();

        if (trimmed === '' || loading) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/ask-evo', {
                method: 'POST',
                headers: askEvoHeaders(),
                credentials: 'same-origin',
                body: JSON.stringify({
                    question: trimmed,
                    page: identity.page,
                    entity_type: identity.entityType ?? null,
                    entity_id: identity.entityId ?? null,
                    scope_key: context?.scope_key ?? null,
                }),
            });
            const payload = (await response.json()) as AskEvoAskResponse;

            if (payload.context) {
                setContext(payload.context);
            }

            if (!payload.ok || !payload.answer) {
                setError(askEvoErrorMessage(payload.error));
                setLoading(false);

                return;
            }

            setTurns((current) => [...current, { question: trimmed, answer: payload.answer ?? '' }]);
            setQuestion('');
        } catch {
            setError('Ask Evo is unavailable.');
        }

        setLoading(false);
    };

    if (!features.ask_evo) {
        return null;
    }

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next && openerRef.current) {
                    window.setTimeout(() => openerRef.current?.focus(), 0);
                }
            }}
        >
            <DrawerContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto overflow-x-hidden"
                aria-labelledby="ask-evo-drawer-title"
            >
                <DrawerHeader className="border-b border-hairline pb-3">
                    <DrawerTitle
                        id="ask-evo-drawer-title"
                        className="flex items-center gap-1.5 text-[13px] font-semibold"
                    >
                        <Sparkle className="size-3.5 text-mute" aria-hidden />
                        Ask Evo
                    </DrawerTitle>
                    <p
                        data-testid="ask-evo-context"
                        className="text-[11px] text-mute"
                        aria-live="polite"
                    >
                        Context: {contextIndicatorLabel(context, identity.page)}
                    </p>
                </DrawerHeader>
                <div className="space-y-3 pt-4 text-ui">
                    {context?.note ? (
                        <p className="text-[12px] text-mute">{context.note}</p>
                    ) : null}
                    {turns.map((turn, index) => (
                        <p key={`${turn.question}-${index}`} className="border-l-2 border-brand/40 pl-2 text-[12px] leading-5">
                            <span className="text-mute">{turn.question} — </span>
                            {turn.answer}
                        </p>
                    ))}
                    {context?.suggestions?.length ? (
                        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Suggested questions">
                            {context.suggestions.map((chip: AskEvoSuggestion) => (
                                <button
                                    key={chip.id}
                                    type="button"
                                    role="listitem"
                                    className="rounded-full border border-hairline px-2 py-1 text-[11px] text-mute hover:text-ink"
                                    onClick={() => {
                                        setQuestion(chip.question);
                                        void ask(chip.question);
                                    }}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                    <form
                        className="flex flex-col gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void ask(question);
                        }}
                    >
                        <Input
                            id={inputId}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder="Ask a question…"
                            size="sm"
                            className="text-ui"
                            aria-label="Ask Evo question"
                            aria-describedby={statusId}
                            aria-busy={loading}
                            disabled={loading}
                        />
                        <p id={statusId} className="sr-only" aria-live="polite">
                            {loading ? 'Ask Evo is thinking' : ''}
                        </p>
                        {error ? (
                            <p role="alert" className="text-[11px] text-destructive">
                                {error}
                            </p>
                        ) : null}
                        <Button type="submit" variant="outline" size="sm" className="w-full" disabled={loading}>
                            {loading ? 'Asking…' : 'Ask Evo'}
                        </Button>
                    </form>
                    {context?.actions?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {context.actions.map((action) => (
                                <Button
                                    key={action.id}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setOpen(false);
                                        router.visit(action.href);
                                    }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
