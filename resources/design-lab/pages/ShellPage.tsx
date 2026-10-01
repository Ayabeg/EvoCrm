import { useEffect, useState } from 'react';
import {
    CaretLeft,
    GearSix,
    House,
    List,
    MagnifyingGlass,
    Plus,
    StarFour,
} from '@/evo/icons';
import { ShellModeSwitch } from '@/evo/shell/mode-switch';
import type { ShellMode } from '@/evo/shell/mode-switch';
import { LabLink } from '../components/LabLink';

const AGENTS = [
    {
        id: 'closer',
        name: 'Closer',
        role: 'Opportunités actives → prochaines actions',
        section: 'your' as const,
    },
    {
        id: 'qualifier',
        name: 'Qualifier',
        role: 'Qualifie et enrichit les leads entrants',
        section: 'your' as const,
    },
    {
        id: 'quote-desk',
        name: 'Quote desk',
        role: 'Prépare et suit les devis',
        section: 'your' as const,
    },
    {
        id: 'after-sale',
        name: 'After-sale',
        role: 'Suit les clients après la vente',
        section: 'your' as const,
    },
    {
        id: 'desk',
        name: 'Desk router',
        role: 'Route les conversations Inbox',
        section: 'system' as const,
    },
];

const MENU = [
    { id: 'home', label: 'Accueil' },
    { id: 'inbox', label: 'Inbox' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'deals', label: 'Affaires' },
];

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

export function ShellPage() {
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const [mode, setMode] = useState<ShellMode>('menu');
    const [collapsed, setCollapsed] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const agent = AGENTS.find((item) => item.id === selectedAgent) ?? null;

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <div className="flex h-dvh flex-col bg-[var(--evo-canvas)] text-[var(--evo-ink)]">
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--evo-hairline)] px-4 py-3">
                <div>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Design Lab · PR2
                    </p>
                    <h1 className="text-[20px] font-semibold">Shell</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <LabLink
                        to={{ name: 'tokens' }}
                        className="rounded-[8px] px-2 py-1 text-[13px] text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]"
                    >
                        Jetons
                    </LabLink>
                    <button
                        type="button"
                        className="h-8 rounded-[8px] border border-[var(--evo-hairline)] px-2.5 text-[12px]"
                        onClick={() =>
                            setTheme((current) =>
                                current === 'dark' ? 'light' : 'dark',
                            )
                        }
                    >
                        {theme === 'dark' ? 'Clair' : 'Sombre'}
                    </button>
                    <button
                        type="button"
                        className="h-8 rounded-[8px] border border-[var(--evo-hairline)] px-2.5 text-[12px]"
                        aria-pressed={reduceMotion}
                        onClick={() => setReduceMotion((current) => !current)}
                    >
                        {reduceMotion ? 'Mouvement on' : 'Mouvement réduit'}
                    </button>
                    <button
                        type="button"
                        className="h-8 rounded-[8px] bg-[var(--evo-teal)] px-2.5 text-[12px] text-white"
                        onClick={() => setPaletteOpen(true)}
                    >
                        Palette ⌘K
                    </button>
                </div>
            </header>

            <div
                className="evo-shell flex min-h-0 min-w-0 flex-1 overflow-hidden"
                data-collapsed={collapsed ? 'true' : 'false'}
                data-lab-shell
            >
                <aside
                    data-shell="lab"
                    className="evo-rail-slot evo-cabinet hidden h-full min-h-0 shrink-0 overflow-hidden border-r border-shell-hairline md:flex md:flex-col"
                    style={{
                        width: collapsed ? 0 : 212,
                        borderRightWidth: collapsed ? 0 : undefined,
                    }}
                >
                    <div
                        className="evo-rail-panel flex h-full min-h-0 flex-col"
                        style={{ width: 212 }}
                    >
                        <div className="px-3 pt-3">
                            <ShellModeSwitch
                                mode={mode}
                                onModeChange={(next) => {
                                    setMode(next);
                                    setCollapsed(false);
                                }}
                            />
                        </div>
                        <div className="relative min-h-0 flex-1">
                            <ModePane
                                active={mode === 'menu'}
                                exitLeft={mode === 'agents'}
                                reduceMotion={reduceMotion}
                            >
                                <div className="flex h-10 items-center gap-2 px-2">
                                    <span className="text-[14px] font-semibold">
                                        EvoCRM
                                    </span>
                                    <button
                                        type="button"
                                        className="ml-auto grid size-8 place-items-center rounded-lg text-shell-muted hover:bg-[var(--evo-hover)]"
                                        aria-label="Fermer le menu"
                                        onClick={() => setCollapsed(true)}
                                    >
                                        <CaretLeft className="size-4" />
                                    </button>
                                </div>
                                <ul className="mt-3 space-y-0.5 px-2">
                                    {MENU.map((item, index) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                className="evo-nav-link flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px]"
                                                aria-current={
                                                    index === 0
                                                        ? 'page'
                                                        : undefined
                                                }
                                            >
                                                <House className="size-4" />
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </ModePane>

                            <ModePane
                                active={mode === 'agents'}
                                reduceMotion={reduceMotion}
                            >
                                {agent ? (
                                    <AgentView
                                        agent={agent}
                                        reduceMotion={reduceMotion}
                                        onBack={() => setSelectedAgent(null)}
                                    />
                                ) : (
                                    <DirectoryView
                                        reduceMotion={reduceMotion}
                                        onSelect={setSelectedAgent}
                                    />
                                )}
                            </ModePane>

                            <ModePane
                                active={mode === 'search'}
                                reduceMotion={reduceMotion}
                            >
                                <div className="px-3 py-3">
                                    <label className="sr-only" htmlFor="lab-search">
                                        Search EvoCRM…
                                    </label>
                                    <input
                                        id="lab-search"
                                        type="search"
                                        placeholder="Search EvoCRM…"
                                        className="h-10 w-full rounded-lg border border-shell-hairline bg-shell-pill px-2.5 text-[14px]"
                                    />
                                    <p className="mt-3 text-[13px] text-shell-muted">
                                        Recherche dans la barre — même largeur.
                                    </p>
                                </div>
                            </ModePane>
                        </div>
                    </div>
                </aside>

                <div className="evo-workspace relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    {collapsed ? (
                        <button
                            type="button"
                            className="absolute top-3 left-3 z-30 grid size-8 place-items-center rounded-lg bg-[var(--evo-surface)]"
                            aria-label="Ouvrir le menu"
                            onClick={() => setCollapsed(false)}
                        >
                            <List className="size-4" />
                        </button>
                    ) : null}
                    <div className="app-topbar flex h-12 items-center border-b border-[var(--evo-hairline)] px-4 text-[13px]">
                        Accueil · workspace clair
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-6">
                        <p className="text-[14px] text-[var(--evo-ink-secondary)]">
                            Une seule barre 212px. Menu / Agents / Recherche
                            sont des modes. Entrer dans Closer ne pousse pas le
                            workspace.
                        </p>
                    </div>
                </div>
            </div>

            {paletteOpen ? (
                <div className="fixed inset-0 z-[80]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-[color-mix(in_srgb,var(--evo-ink)_45%,transparent)]"
                        aria-label="Fermer la palette de commandes"
                        onClick={() => setPaletteOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Palette de commandes"
                        data-command="os"
                        className="absolute top-[18vh] left-1/2 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded-[12px] border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-3 shadow-[var(--evo-shadow-modal)]"
                    >
                        <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--evo-ink-muted)] uppercase">
                            Naviguer
                        </p>
                        <p className="mt-2 text-[14px] font-medium">Accueil</p>
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                            /dashboard
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ModePane({
    active,
    exitLeft,
    reduceMotion,
    children,
}: {
    active: boolean;
    exitLeft?: boolean;
    reduceMotion: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            inert={!active}
            className={
                active
                    ? 'evo-mode evo-mode-on absolute inset-0 flex min-h-0 flex-col'
                    : exitLeft
                      ? 'evo-mode evo-mode-exit-left absolute inset-0 flex min-h-0 flex-col'
                      : 'evo-mode evo-mode-off absolute inset-0 flex min-h-0 flex-col'
            }
            style={reduceMotion ? { transition: 'none' } : undefined}
        >
            {children}
        </div>
    );
}

function DirectoryView({
    onSelect,
    reduceMotion,
}: {
    onSelect: (id: string) => void;
    reduceMotion: boolean;
}) {
    const yours = AGENTS.filter((item) => item.section === 'your');
    const system = AGENTS.filter((item) => item.section === 'system');

    return (
        <div
            className="flex min-h-0 flex-1 flex-col"
            style={
                reduceMotion
                    ? undefined
                    : {
                          animation: 'none',
                          transform: 'translateX(0)',
                      }
            }
        >
            <div className="flex h-14 items-center gap-2 border-b border-shell-hairline px-4 text-[15px] font-semibold">
                <StarFour className="size-[18px]" />
                Agents
            </div>
            <div className="relative mx-3 mt-3">
                <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <input
                    type="search"
                    placeholder="Rechercher un agent…"
                    className="h-9 w-full rounded-md border border-shell-hairline bg-white/[0.035] pr-3 pl-10 text-[12px]"
                />
            </div>
            <div className="mx-3 mt-3 grid grid-cols-2 rounded-md bg-white/[0.04] p-0.5">
                <span className="grid h-7 place-items-center rounded bg-white/[0.1] text-[12px]">
                    Agents
                </span>
                <span className="grid h-7 place-items-center text-[12px] text-shell-muted">
                    Chats
                </span>
            </div>
            <div className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pt-5">
                <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-[0.09em] text-shell-muted uppercase">
                    VOS AGENTS
                </p>
                <ul className="space-y-1">
                    {yours.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className="flex min-h-[58px] w-full flex-col items-start rounded-lg px-2 text-left hover:bg-white/[0.08]"
                                onClick={() => onSelect(item.id)}
                            >
                                <span className="text-[13px] font-medium">
                                    {item.name}
                                </span>
                                <span className="text-[11px] text-shell-muted">
                                    {item.role}
                                </span>
                                <span className="text-[10px] text-shell-muted">
                                    Disponible
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="mt-6 px-2 pb-1.5 text-[11px] font-semibold tracking-[0.09em] text-shell-muted uppercase">
                    SYSTÈME
                </p>
                {system.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className="flex min-h-[58px] w-full flex-col items-start rounded-lg px-2 text-left"
                        onClick={() => onSelect(item.id)}
                    >
                        <span className="text-[13px] font-medium">
                            {item.name}
                        </span>
                        <span className="text-[11px] text-shell-muted">
                            {item.role}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function AgentView({
    agent,
    onBack,
    reduceMotion,
}: {
    agent: (typeof AGENTS)[number];
    onBack: () => void;
    reduceMotion: boolean;
}) {
    return (
        <div
            className="flex min-h-0 flex-1 flex-col"
            style={
                reduceMotion
                    ? undefined
                    : { transform: 'translateX(0)' }
            }
        >
            <header className="flex h-14 items-center border-b border-shell-hairline px-3">
                <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-[13px]"
                    onClick={onBack}
                >
                    Agents
                </button>
            </header>
            <div className="px-4 pt-4">
                <h2 className="text-[15px] font-semibold">{agent.name}</h2>
                <p className="text-[12px] text-shell-muted">{agent.role}</p>
                <p className="mt-1 text-[11px] text-shell-muted">Disponible</p>
                <button
                    type="button"
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--evo-primary)] text-[12px] font-semibold text-[var(--evo-on-primary)]"
                >
                    <Plus className="size-4" />
                    + Nouvelle conversation
                </button>
            </div>
            <div className="px-4 pt-5 text-[12px] text-shell-muted">
                <p className="text-[11px] font-semibold tracking-[0.09em] uppercase">
                    CONVERSATIONS
                </p>
                <p className="mt-2">Aucune conversation.</p>
                <p className="mt-6 text-[11px] font-semibold tracking-[0.09em] uppercase">
                    CONTEXTE
                </p>
                <p className="mt-2">Affaires · Leads · Inbox · Devis</p>
            </div>
            <footer className="mt-auto border-t border-shell-hairline px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-[12px]">
                    <GearSix className="size-4" />
                    Réglages de l&apos;agent
                </span>
            </footer>
        </div>
    );
}
