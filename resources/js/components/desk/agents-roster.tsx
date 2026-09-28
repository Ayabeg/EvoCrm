import { router } from '@inertiajs/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { AgentsViewModeControl } from '@/components/desk/agents-view-mode-control';
import { AgentsViewModePanel } from '@/components/desk/agents-view-mode-panel';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { BOT_CATALOG } from '@/lib/desk/bot-catalog';
import { useAgentsViewMode } from '@/lib/desk/use-agents-view-mode';
import { cn } from '@/lib/utils';

type Agent = {
    description: string;
    id: string;
    job: string;
    name: string;
    pinned?: boolean;
};

const AGENTS: Agent[] = BOT_CATALOG.filter((bot) => bot.group === 'sales').map(
    (bot) => ({
        id: bot.id,
        name: bot.name,
        job: bot.job,
        description: bot.description,
        pinned: bot.id === 'closer',
    }),
);

export function AgentsRoster({ className }: { className?: string }) {
    const [startingBot, setStartingBot] = useState<string | null>(null);
    const [viewMode] = useAgentsViewMode();

    function startChat(agent: Agent) {
        setStartingBot(agent.id);
        router.visit(`/agents/chats?bot=${encodeURIComponent(agent.id)}`);
    }

    return (
        <section
            aria-labelledby="agents-roster-title"
            className={cn(
                'w-full rounded-2xl border border-shell-hairline bg-shell-paper/75 p-3 shadow-[0_14px_36px_rgba(13,27,36,0.045)]',
                className,
            )}
            data-agents-roster
        >
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2">
                <div className="min-w-0">
                    <h2
                        id="agents-roster-title"
                        className="text-sm font-semibold tracking-[-0.01em] text-shell-ink"
                    >
                        Choose a teammate
                    </h2>
                    <p className="text-xs text-shell-muted">
                        {AGENTS.length} agents
                    </p>
                </div>
                <AgentsViewModeControl className="max-w-full" layout="hug" />
            </div>

            <AgentsViewModePanel mode={viewMode}>
                {viewMode === 'grid' ? (
                    <div
                        className="grid grid-cols-2 gap-1 sm:grid-cols-4"
                        role="list"
                    >
                        {AGENTS.map((agent) => (
                            <RosterTile
                                key={agent.id}
                                agent={agent}
                                disabled={startingBot !== null}
                                starting={startingBot === agent.id}
                                onStart={startChat}
                            />
                        ))}
                    </div>
                ) : viewMode === 'table' ? (
                    <div className="flex flex-col gap-0.5" role="list">
                        {AGENTS.map((agent) => (
                            <RosterTableRow
                                key={agent.id}
                                agent={agent}
                                disabled={startingBot !== null}
                                starting={startingBot === agent.id}
                                onStart={startChat}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-1 sm:grid-cols-2" role="list">
                        {AGENTS.map((agent) => (
                            <RosterListRow
                                key={agent.id}
                                agent={agent}
                                disabled={startingBot !== null}
                                starting={startingBot === agent.id}
                                onStart={startChat}
                            />
                        ))}
                    </div>
                )}
            </AgentsViewModePanel>
        </section>
    );
}

function RosterListRow({
    agent,
    disabled,
    onStart,
    starting,
}: {
    agent: Agent;
    disabled: boolean;
    onStart: (agent: Agent) => void;
    starting: boolean;
}) {
    return (
        <div role="listitem">
            <button
                type="button"
                className="group flex min-h-[72px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-shell-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange motion-reduce:transition-none"
                disabled={disabled}
                onClick={() => onStart(agent)}
            >
                <BloubAvatar
                    label={
                        agent.pinned
                            ? `${agent.name} avatar, pinned and listening`
                            : `${agent.name} avatar`
                    }
                    size={28}
                    state={agent.pinned ? 'listen' : 'idle'}
                />
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-shell-ink">
                        <span className="truncate">{agent.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs leading-4 text-shell-muted">
                        {agent.description}
                    </span>
                </span>
                <ArrowUpRight
                    aria-hidden="true"
                    className={cn(
                        'size-4 shrink-0 text-shell-orange transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none',
                        starting && 'animate-pulse motion-reduce:animate-none',
                    )}
                    weight="regular"
                />
            </button>
        </div>
    );
}

function RosterTile({
    agent,
    disabled,
    onStart,
    starting,
}: {
    agent: Agent;
    disabled: boolean;
    onStart: (agent: Agent) => void;
    starting: boolean;
}) {
    return (
        <div role="listitem">
            <button
                type="button"
                className="flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center transition-colors duration-150 hover:bg-shell-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange motion-reduce:transition-none"
                disabled={disabled}
                onClick={() => onStart(agent)}
            >
                <BloubAvatar
                    label={
                        agent.pinned
                            ? `${agent.name} avatar, pinned and listening`
                            : `${agent.name} avatar`
                    }
                    size={28}
                    state={agent.pinned ? 'listen' : 'idle'}
                />
                <span className="w-full truncate text-sm font-medium text-shell-ink">
                    {agent.name}
                </span>
                <span className="sr-only">{agent.job}</span>
                {starting ? (
                    <span className="sr-only">Starting chat</span>
                ) : null}
            </button>
        </div>
    );
}

function RosterTableRow({
    agent,
    disabled,
    onStart,
    starting,
}: {
    agent: Agent;
    disabled: boolean;
    onStart: (agent: Agent) => void;
    starting: boolean;
}) {
    return (
        <div role="listitem">
            <button
                type="button"
                className="grid min-h-9 w-full grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-3 rounded-lg px-2.5 text-left transition-colors duration-150 hover:bg-shell-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell-orange motion-reduce:transition-none"
                disabled={disabled}
                onClick={() => onStart(agent)}
            >
                <span className="truncate text-sm font-medium text-shell-ink">
                    {agent.name}
                </span>
                <span className="truncate text-xs text-shell-muted">
                    {agent.job}
                </span>
                {starting ? (
                    <span className="sr-only">Starting chat</span>
                ) : null}
            </button>
        </div>
    );
}
