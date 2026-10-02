import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    AgentMessage,
    AgentPlan,
    AgentProgress,
    AgentTask,
    ApprovalCard,
    PromptSuggestion,
    ReasoningDisclosure,
    SourceCitation,
    StreamingState,
    ThinkingState,
    ToolCall,
    ToolResult,
    UserMessage,
} from '@/evo/ai';
import type { AgentApproval } from '@/evo/ai/types';
import { Moon, Sun } from '@/evo/icons';

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readThemeParam(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return new URLSearchParams(window.location.search).get('theme') === 'dark'
        ? 'dark'
        : 'light';
}

function StateBlock({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className="rounded-[10px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-4"
            data-lab-state={id}
        >
            <header className="mb-4">
                <h2 className="text-[14px] font-semibold text-[var(--evo-ink)]">
                    {title}
                </h2>
                <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                    {description}
                </p>
            </header>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

export function AgentsPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const [approval, setApproval] = useState<AgentApproval>({
        id: 'approval-quote',
        title: 'Envoyer le devis à Nord Afrique Distribution',
        description:
            'L’agent propose d’envoyer le devis Q-1842 (1 280 000 DA). Cette action n’est jamais exécutée automatiquement.',
        action: 'send_quote',
        status: 'pending',
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <div className="mx-auto max-w-[880px] pb-16" data-lab-page="agents">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--evo-hairline)] pb-5">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Design Lab · PR7
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">
                        Agents
                    </h1>
                    <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                        États de message pour le workspace Agents. Fixtures
                        étiquetées — pas de fausses conversations de
                        production. Entrer envoie, Maj+Entrée passe à la ligne.
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-3 text-[12px] font-medium"
                    onClick={() =>
                        setTheme((current) =>
                            current === 'dark' ? 'light' : 'dark',
                        )
                    }
                >
                    {theme === 'dark' ? (
                        <Sun className="size-3.5" weight="regular" />
                    ) : (
                        <Moon className="size-3.5" weight="regular" />
                    )}
                    {theme === 'dark' ? 'Clair' : 'Sombre'}
                </button>
            </header>

            <div className="mt-6 grid gap-4">
                <StateBlock
                    id="empty"
                    title="Vide"
                    description="Aucune conversation. Message d’accueil français."
                >
                    <div
                        className="rounded-[10px] border border-dashed border-[var(--evo-hairline)] px-6 py-10 text-center"
                        data-agent-chat-empty
                    >
                        <p className="text-[16px] font-semibold">Closer</p>
                        <p className="mt-1.5 text-[13px] text-[var(--evo-ink-secondary)]">
                            Transformez vos opportunités actives en prochaines
                            actions.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                            <PromptSuggestion>
                                Relancer une affaire
                            </PromptSuggestion>
                            <PromptSuggestion>
                                Qualifier un lead
                            </PromptSuggestion>
                        </div>
                    </div>
                </StateBlock>

                <StateBlock
                    id="user"
                    title="Utilisateur"
                    description="Bulle alignée à droite, surface encre."
                >
                    <UserMessage>
                        Quelles affaires demandent un suivi aujourd’hui ?
                    </UserMessage>
                </StateBlock>

                <StateBlock
                    id="assistant"
                    title="Assistant"
                    description="Réponse markdown, sans identité Prompt Kit."
                >
                    <AgentMessage>
                        {'**3 affaires** à relancer aujourd’hui :\n\n- Nord Afrique Distribution — devis envoyé\n- Atlas Retail — relance prévue\n- Oasis Médical — décision en attente'}
                    </AgentMessage>
                </StateBlock>

                <StateBlock
                    id="streaming"
                    title="Streaming"
                    description="Région live + loader. Respecte prefers-reduced-motion."
                >
                    <StreamingState label="Réponse en cours…" />
                    <ThinkingState label="Closer consulte le contexte CRM…" />
                </StateBlock>

                <StateBlock
                    id="tool-running"
                    title="Appel d’outil — en cours"
                    description="PastaUI tool-timeline, statut En cours."
                >
                    <ToolCall
                        call={{
                            id: 'tool-running',
                            name: 'crm.search_deals',
                            status: 'running',
                            input: 'stage=proposal, owner=me',
                        }}
                    />
                </StateBlock>

                <StateBlock
                    id="tool-done"
                    title="Appel d’outil — terminé"
                    description="Outil terminé + résultat repliable."
                >
                    <ToolCall
                        call={{
                            id: 'tool-done',
                            name: 'crm.search_deals',
                            status: 'done',
                            input: 'stage=proposal',
                            output: '3 affaires',
                        }}
                    />
                    <ToolResult title="Résultat · crm.search_deals" defaultOpen>
                        {'[{"id":1842,"name":"Nord Afrique Distribution"},{"id":1901,"name":"Atlas Retail"}]'}
                    </ToolResult>
                </StateBlock>

                <StateBlock
                    id="tool-error"
                    title="Appel d’outil — erreur"
                    description="Échec d’outil, jamais silencieux."
                >
                    <ToolCall
                        call={{
                            id: 'tool-error',
                            name: 'openmanus.run',
                            status: 'error',
                            error: 'OpenManus est désactivé sur cet espace (fail-closed).',
                        }}
                    />
                </StateBlock>

                <StateBlock
                    id="approval"
                    title="Demande d’approbation"
                    description="HITL : Approuver / Refuser. Jamais d’auto-exécution."
                >
                    <ApprovalCard
                        approval={approval}
                        onApprove={(next) =>
                            setApproval({ ...next, status: 'approved' })
                        }
                        onDeny={(next) =>
                            setApproval({ ...next, status: 'denied' })
                        }
                    />
                </StateBlock>

                <StateBlock
                    id="error"
                    title="Erreur"
                    description="Réponse assistant en échec."
                >
                    <AgentMessage markdown={false}>
                        <p className="rounded-[8px] border border-[var(--evo-danger)] bg-[var(--evo-danger-soft)] px-3 py-2 text-[13px] text-[var(--evo-danger)]">
                            Le service est momentanément indisponible.
                            Réessayez.
                        </p>
                    </AgentMessage>
                </StateBlock>

                <StateBlock
                    id="reasoning"
                    title="Raisonnement, sources, plan"
                    description="PastaUI reasoning + Tool UI plan / progress / tasks."
                >
                    <ReasoningDisclosure defaultOpen>
                        Je commence par les affaires en proposition, puis je
                        propose une relance uniquement si le dernier échange a
                        plus de 5 jours.
                    </ReasoningDisclosure>
                    <SourceCitation
                        title="Affaire · Nord Afrique Distribution"
                        href="/crm/deals/1842"
                    />
                    <AgentPlan
                        plan={{
                            title: 'Plan de relance',
                            steps: [
                                {
                                    id: '1',
                                    label: 'Lister les affaires ouvertes',
                                    status: 'done',
                                },
                                {
                                    id: '2',
                                    label: 'Rédiger le message',
                                    status: 'running',
                                },
                                {
                                    id: '3',
                                    label: 'Attendre l’approbation',
                                    status: 'pending',
                                },
                            ],
                        }}
                    />
                    <AgentProgress
                        progress={{
                            label: 'Analyse CRM',
                            current: 2,
                            total: 3,
                        }}
                    />
                    <AgentTask
                        items={[
                            { id: 'a', label: 'Ouvrir la fiche', done: true },
                            { id: 'b', label: 'Préparer l’e-mail', done: false },
                        ]}
                    />
                </StateBlock>
            </div>
        </div>
    );
}
