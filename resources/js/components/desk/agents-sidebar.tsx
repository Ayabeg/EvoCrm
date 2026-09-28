import { Link, usePage } from '@inertiajs/react';
import { ChatCircle, House, Plus, Robot } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { useBotDeskStore } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

type ChatSummary = {
    id: string;
    title: string;
    relativeTime: string;
};

type BotSummary = {
    id: string;
    label: string;
};

const SALES_BOTS: BotSummary[] = [
    { id: 'closer', label: 'Closer' },
    { id: 'qualifier', label: 'Qualifier' },
    { id: 'quote-desk', label: 'Quote desk' },
    { id: 'after-sale', label: 'After-sale' },
];

const INTERNAL_BOTS: BotSummary[] = [{ id: 'desk', label: 'Desk router' }];

const EVOPULSE_BOTS: BotSummary[] = [
    { id: 'evopulse-shell-ia', label: 'EvoPulse · Shell IA' },
    { id: 'evopulse-pulse-ui', label: 'EvoPulse · Pulse UI' },
    { id: 'evopulse-command-ui', label: 'EvoPulse · Command UI' },
    { id: 'night-shift', label: 'Night shift' },
];

const sectionLinkClass =
    'group flex size-9 items-center justify-center rounded-lg text-shell-muted transition-colors hover:bg-white/[0.08] hover:text-shell-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange motion-reduce:transition-none';

const rowClass =
    'flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-shell-ink-2 transition-colors hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange motion-reduce:transition-none';

type Props = {
    chats?: ChatSummary[];
    customBots?: BotSummary[];
    onNavigate?: () => void;
};

export function AgentsSidebar({
    chats = [],
    customBots = [],
    onNavigate,
}: Props) {
    const page = usePage();
    const store = useBotDeskStore();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const visibleChats = chats.length > 0 ? chats : store.chats;
    const visibleCustomBots: BotSummary[] =
        customBots.length > 0
            ? customBots
            : store.customBots.map((bot) => ({
                  id: bot.id,
                  label: bot.name,
              }));

    return (
        <aside
            aria-label="Agents desk navigation"
            className="evo-agents-sidebar flex min-h-0 w-full shrink-0 flex-col"
            data-agents-sidebar
        >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-shell-hairline px-3">
                <Link
                    href="/agents"
                    className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-[14px] font-semibold text-shell-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange"
                    aria-current={path === '/agents' ? 'page' : undefined}
                    onClick={onNavigate}
                >
                    <Robot
                        className="size-5 shrink-0 text-shell-orange"
                        weight="regular"
                        aria-hidden
                    />
                    <span className="truncate">Agents</span>
                </Link>
                <Link
                    href="/agents/chats"
                    className="grid size-8 place-items-center rounded-lg text-shell-muted hover:bg-white/[0.08] hover:text-shell-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange"
                    aria-label="New chat"
                    title="New chat"
                    onClick={onNavigate}
                >
                    <Plus className="size-4" weight="bold" aria-hidden />
                </Link>
            </div>

            <nav
                aria-label="Agents sections"
                className="flex shrink-0 items-center gap-1 px-3 py-2"
            >
                <SectionLink
                    href="/agents"
                    label="Desk"
                    icon={House}
                    active={path === '/agents'}
                    onNavigate={onNavigate}
                />
                <SectionLink
                    href="/agents/chats"
                    label="Chats"
                    icon={ChatCircle}
                    active={
                        path === '/agents/chats' ||
                        path.startsWith('/agents/chats/')
                    }
                    onNavigate={onNavigate}
                />
                <SectionLink
                    href="/agents/bots"
                    label="Bots"
                    icon={Robot}
                    active={
                        path === '/agents/bots' ||
                        path.startsWith('/agents/bots/')
                    }
                    onNavigate={onNavigate}
                />
            </nav>

            <div className="evo-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                <SidebarSection title="CHATS">
                    {visibleChats.length > 0 ? (
                        <ul className="space-y-0.5">
                            {visibleChats.map((chat) => (
                                <li key={chat.id}>
                                    <Link
                                        href={`/agents/chats/${chat.id}`}
                                        className={rowClass}
                                        onClick={onNavigate}
                                    >
                                        <BloubAvatar
                                            botId={
                                                store.chats.find(
                                                    (item) =>
                                                        item.id === chat.id,
                                                )?.botId
                                            }
                                            label={`${chat.title} avatar`}
                                            size={16}
                                            state="idle"
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                            {chat.title}
                                        </span>
                                        <span className="shrink-0 text-[11px] text-shell-muted">
                                            {chat.relativeTime}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-2 py-2 text-[12px] text-shell-muted">
                            No chats yet.
                        </p>
                    )}
                </SidebarSection>

                <SidebarSection title="BOTS" className="mt-5">
                    <Link
                        href="/agents/bots/new"
                        className={cn(
                            rowClass,
                            'mb-2 text-shell-orange hover:text-shell-orange',
                        )}
                        onClick={onNavigate}
                    >
                        <Plus
                            className="size-4 shrink-0"
                            weight="bold"
                            aria-hidden
                        />
                        <span>Create a new Bot</span>
                    </Link>

                    <BotList bots={SALES_BOTS} onNavigate={onNavigate} />

                    <div
                        className="my-3 flex items-center gap-2 px-2"
                        role="separator"
                    >
                        <span className="h-px flex-1 bg-shell-hairline" />
                        <span className="text-[10px] font-semibold tracking-[0.08em] text-shell-muted uppercase">
                            Internal
                        </span>
                        <span className="h-px flex-1 bg-shell-hairline" />
                    </div>

                    <BotList bots={INTERNAL_BOTS} onNavigate={onNavigate} />

                    <h3 className="mt-4 px-2 text-[10px] font-semibold tracking-[0.08em] text-shell-muted uppercase">
                        EvoPulse
                    </h3>
                    <BotList bots={EVOPULSE_BOTS} onNavigate={onNavigate} />

                    <h3 className="mt-4 px-2 text-[10px] font-semibold tracking-[0.08em] text-shell-muted uppercase">
                        Custom
                    </h3>
                    {visibleCustomBots.length > 0 ? (
                        <BotList
                            bots={visibleCustomBots}
                            onNavigate={onNavigate}
                        />
                    ) : (
                        <p className="px-2 py-2 text-[12px] text-shell-muted">
                            No custom bots yet.
                        </p>
                    )}
                </SidebarSection>
            </div>

            <footer className="shrink-0 border-t border-shell-hairline px-3 py-3 text-[11px] leading-4 text-shell-muted">
                The desk is open in the workspace.
            </footer>
        </aside>
    );
}

function SidebarSection({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section
            aria-labelledby={`agents-${title.toLowerCase()}`}
            className={className}
        >
            <h2
                id={`agents-${title.toLowerCase()}`}
                className="px-2 pb-1 text-[10px] font-semibold tracking-[0.08em] text-shell-muted uppercase"
            >
                {title}
            </h2>
            {children}
        </section>
    );
}

function BotList({
    bots,
    onNavigate,
}: {
    bots: BotSummary[];
    onNavigate?: () => void;
}) {
    return (
        <ul className="space-y-0.5">
            {bots.map((bot) => (
                <li key={bot.id}>
                    <Link
                        href={`/agents/bots/${bot.id}`}
                        className={rowClass}
                        onClick={onNavigate}
                    >
                        <BloubAvatar
                            botId={bot.id}
                            label={`${bot.label} avatar`}
                            size={16}
                            state="idle"
                        />
                        <span className="min-w-0 truncate">{bot.label}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function SectionLink({
    href,
    label,
    icon: Icon,
    active,
    onNavigate,
}: {
    href: string;
    label: string;
    icon: Icon;
    active: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={href}
            className={cn(
                sectionLinkClass,
                active && 'bg-white/[0.12] text-shell-ink',
            )}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
            onClick={onNavigate}
        >
            <Icon className="size-4" weight="regular" aria-hidden />
            <span className="sr-only">{label}</span>
        </Link>
    );
}
