import {
    BarChart3,
    Bot,
    Building2,
    Calendar,
    FileText,
    Handshake,
    House,
    Inbox,
    LayoutGrid,
    LifeBuoy,
    Megaphone,
    MessageCircle,
    Search,
    Send,
    Settings,
    UserPlus,
    Users,
    Waypoints,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useRef } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    AGENTS,
    NAV_SECTIONS,
    SEARCH_INDEX,
    SETTINGS_ITEM,
} from '@/components/shell/shell-data';
import type {
    SearchHit,
    ShellMode,
    ShellNavItem,
} from '@/components/shell/shell-data';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/shell/tabs';
import { cn } from '@/lib/utils';

const MODES: { value: ShellMode; label: string; icon: LucideIcon }[] = [
    { value: 'menu', label: 'Menu', icon: LayoutGrid },
    { value: 'agents', label: 'Agents', icon: Bot },
    { value: 'search', label: 'Search', icon: Search },
];

const NAV_ICONS: Record<string, LucideIcon> = {
    home: House,
    inbox: Inbox,
    companies: Building2,
    contacts: Users,
    leads: UserPlus,
    deals: Handshake,
    'lead-os': Waypoints,
    tickets: LifeBuoy,
    meetings: Calendar,
    quotes: FileText,
    outbound: Send,
    whatsapp: MessageCircle,
    adhub: Megaphone,
    reports: BarChart3,
    settings: Settings,
};

const HIT_ICONS: Record<SearchHit['kind'], LucideIcon> = {
    Deal: Handshake,
    Company: Building2,
    Contact: Users,
    Lead: UserPlus,
};

const switchClass =
    'h-9 w-full min-w-0 justify-start gap-0 overflow-hidden rounded-full bg-shell-track p-0.5 text-shell-muted [&_[data-slot=tab-indicator]]:rounded-full [&_[data-slot=tab-indicator]]:bg-shell-pill [&_[data-slot=tab-indicator]]:shadow-[0_1px_1px_rgba(13,27,36,0.16)] [&_[data-slot=tab-indicator]]:transition-[opacity,color,background-color] [&_[data-slot=tab-indicator]]:duration-150 [&_[data-slot=tab-indicator]]:ease-[ease]';

const modeTabClass =
    'group h-8 w-8 shrink-0 grow-0 rounded-full px-0 text-[13px] text-shell-muted transition-colors duration-150 data-active:w-auto data-active:px-2.5 data-active:text-shell-ink sm:h-8 sm:px-0 sm:text-[13px] data-active:sm:px-2.5 motion-reduce:transition-none';

type Props = {
    mode: ShellMode;
    onModeChange: (mode: ShellMode) => void;
    pageId: string;
    onPageChange: (id: string) => void;
    query: string;
    onQueryChange: (query: string) => void;
    onPickHit: (hit: SearchHit) => void;
};

export function EvoSidebar({
    mode,
    onModeChange,
    pageId,
    onPageChange,
    query,
    onQueryChange,
    onPickHit,
}: Props) {
    const searchRef = useRef<HTMLInputElement>(null);
    const searchId = useId();

    useEffect(() => {
        if (mode === 'search') {
            searchRef.current?.focus();
        }
    }, [mode]);

    const hits = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return SEARCH_INDEX;
        }

        return SEARCH_INDEX.filter((hit) =>
            `${hit.kind} ${hit.title} ${hit.detail}`
                .toLowerCase()
                .includes(needle),
        );
    }, [query]);

    return (
        <Tabs
            className="flex min-h-0 flex-1 flex-col gap-0"
            value={mode}
            onValueChange={(value) => {
                if (
                    value === 'menu' ||
                    value === 'agents' ||
                    value === 'search'
                ) {
                    onModeChange(value);
                }
            }}
        >
            <div className="min-w-0 px-3 pt-3 pb-2">
                <TabsList aria-label="Sidebar" className={switchClass}>
                    {MODES.map((item) => {
                        const Icon = item.icon;

                        return (
                            <TabsTab
                                key={item.value}
                                className={modeTabClass}
                                value={item.value}
                            >
                                <Icon className="size-4" strokeWidth={1.75} />
                                <span className="sr-only group-data-active:not-sr-only group-data-active:ml-1.5">
                                    {item.label}
                                </span>
                            </TabsTab>
                        );
                    })}
                </TabsList>
            </div>

            <TabsPanel
                className="flex min-h-0 flex-1 flex-col px-3"
                keepMounted={false}
                value="menu"
            >
                <div className="evo-scroll min-h-0 flex-1 overflow-y-auto pb-2">
                    <div className="flex h-8 items-center gap-2">
                        <AppLogoIcon className="size-7" />
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-[13px] font-medium text-shell-ink">
                                Evotechly
                            </span>
                            <span className="block truncate text-[11px] text-shell-faint">
                                EvoCRM
                            </span>
                        </span>
                    </div>

                    {NAV_SECTIONS.map((section) => (
                        <section key={section.id}>
                            <h2 className="mt-2 mb-1 text-[11px] font-normal tracking-[0.06em] text-shell-faint uppercase">
                                {section.label}
                            </h2>
                            <ul>
                                {section.items.map((item) => (
                                    <li key={item.id}>
                                        <NavButton
                                            active={pageId === item.id}
                                            item={item}
                                            onSelect={onPageChange}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <footer className="shrink-0 border-t border-shell-hairline py-2">
                    <NavButton
                        active={pageId === SETTINGS_ITEM.id}
                        item={SETTINGS_ITEM}
                        onSelect={onPageChange}
                    />
                    <div className="mt-1 flex h-8 items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-shell-teal text-[13px] text-shell-pill">
                            EG
                        </span>
                        <span className="min-w-0 leading-tight">
                            <span className="block truncate text-[13px] text-shell-ink">
                                Emma Green
                            </span>
                            <span className="block truncate text-[11px] text-shell-faint">
                                Admin · Algiers
                            </span>
                        </span>
                    </div>
                </footer>
            </TabsPanel>

            <TabsPanel
                className="evo-scroll min-h-0 overflow-y-auto px-3 pb-3"
                keepMounted={false}
                value="agents"
            >
                <ul>
                    {AGENTS.map((agent) => (
                        <li
                            className="flex h-8 items-center gap-2 rounded-[8px]"
                            key={agent.id}
                        >
                            <Bot
                                aria-hidden
                                className="size-4 shrink-0 text-shell-ink-2/88"
                                strokeWidth={1.75}
                            />
                            <span className="min-w-0 flex-1 truncate text-[13px] text-shell-ink">
                                {agent.name}
                            </span>
                            <span className="shrink-0 text-[13px] text-shell-faint">
                                {agent.status}
                            </span>
                        </li>
                    ))}
                </ul>
            </TabsPanel>

            <TabsPanel
                className="flex min-h-0 flex-col px-3 pb-3"
                keepMounted={false}
                value="search"
            >
                <label className="sr-only" htmlFor={searchId}>
                    Search deals, people, and companies
                </label>
                <input
                    ref={searchRef}
                    autoFocus
                    className="h-8 w-full rounded-[8px] border border-shell-hairline bg-shell-pill px-2.5 text-[13px] text-shell-ink outline-none placeholder:text-shell-faint focus-visible:ring-2 focus-visible:ring-shell-teal"
                    id={searchId}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="Deals, people, companies"
                    type="search"
                    value={query}
                />
                <ul className="evo-scroll mt-2 min-h-0 flex-1 overflow-y-auto">
                    {hits.map((hit) => (
                        <li key={hit.id}>
                            <button
                                className="evo-row flex h-8 w-full items-center gap-2 rounded-[8px] text-left text-[13px] text-shell-ink-2"
                                onClick={() => onPickHit(hit)}
                                type="button"
                            >
                                <HitIcon kind={hit.kind} />
                                <span className="min-w-0 truncate">
                                    {hit.title}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </TabsPanel>
        </Tabs>
    );
}

function NavIcon({ id, active }: { id: string; active: boolean }) {
    const Icon = NAV_ICONS[id] ?? House;

    return (
        <Icon
            aria-hidden
            className={cn(
                'size-4 shrink-0',
                active ? 'text-shell-teal' : 'text-shell-ink-2/88',
            )}
            strokeWidth={1.75}
        />
    );
}

function HitIcon({ kind }: { kind: SearchHit['kind'] }) {
    const Icon = HIT_ICONS[kind];

    return (
        <Icon
            aria-hidden
            className="size-4 shrink-0 text-shell-ink-2/88"
            strokeWidth={1.75}
        />
    );
}

function NavButton({
    item,
    active,
    onSelect,
}: {
    item: ShellNavItem;
    active: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            aria-current={active ? 'page' : undefined}
            className={cn(
                'evo-row relative flex h-8 w-full items-center gap-2 overflow-hidden rounded-[8px] text-left text-[13px] text-shell-ink-2',
                active
                    ? 'bg-shell-teal-soft text-shell-teal before:pointer-events-none before:absolute before:top-2.5 before:bottom-2.5 before:left-px before:w-0.5 before:rounded-full before:bg-shell-orange'
                    : 'hover:bg-shell-teal-soft',
            )}
            onClick={() => onSelect(item.id)}
            type="button"
        >
            <NavIcon active={active} id={item.id} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.count != null ? (
                <span className="inline-flex h-[18px] items-center rounded-full border-0 bg-shell-orange/12 px-1.5 text-[13px] text-shell-orange tabular-nums">
                    {item.count}
                </span>
            ) : null}
        </button>
    );
}
