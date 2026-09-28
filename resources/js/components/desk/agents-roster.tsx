import { router } from '@inertiajs/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { BloubAvatar } from '@/components/desk/bloub-avatar';
import { cn } from '@/lib/utils';

type Agent = {
    description: string;
    id: string;
    name: string;
    pinned?: boolean;
};

const AGENTS: Agent[] = [
    {
        id: 'closer',
        name: 'Closer',
        description: 'Move warm opportunities forward.',
        pinned: true,
    },
    {
        id: 'qualifier',
        name: 'Qualifier',
        description: 'Turn inbound interest into signal.',
    },
    {
        id: 'quote-desk',
        name: 'Quote desk',
        description: 'Shape a quote your buyer can sign.',
    },
    {
        id: 'after-sale',
        name: 'After-sale',
        description: 'Keep the handoff warm after close.',
    },
];

export function AgentsRoster({ className }: { className?: string }) {
    const [startingBot, setStartingBot] = useState<string | null>(null);

    function startChat(agent: Agent) {
        setStartingBot(agent.id);
        router.visit(`/agents/chats?bot=${encodeURIComponent(agent.id)}`);
    }

    return (
        <section
            aria-labelledby="agents-roster-title"
            className={cn(
                'w-full rounded-2xl border border-[#0D1B24]/10 bg-white/75 p-3 shadow-[0_14px_36px_rgba(13,27,36,0.045)]',
                className,
            )}
            data-agents-roster
        >
            <div className="flex items-baseline justify-between gap-3 px-2 pb-2">
                <h2
                    id="agents-roster-title"
                    className="text-sm font-semibold tracking-[-0.01em] text-[#0D1B24]"
                >
                    Choose a teammate
                </h2>
                <span className="text-xs text-[#8A969C]">4 agents</span>
            </div>

            <div className="grid gap-1 sm:grid-cols-2" role="list">
                {AGENTS.map((agent) => {
                    const isStarting = startingBot === agent.id;

                    return (
                        <div key={agent.id} role="listitem">
                            <button
                                type="button"
                                className="group flex min-h-[72px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-[#F7F8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8530E] motion-reduce:transition-none"
                                disabled={startingBot !== null}
                                onClick={() => startChat(agent)}
                            >
                                <BloubAvatar
                                    botId={agent.id}
                                    label={
                                        agent.pinned
                                            ? `${agent.name} avatar, pinned and listening`
                                            : `${agent.name} avatar`
                                    }
                                    size={28}
                                    state={agent.pinned ? 'listen' : 'idle'}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#0D1B24]">
                                        <span className="truncate">
                                            {agent.name}
                                        </span>
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs leading-4 text-[#5B6B73]">
                                        {agent.description}
                                    </span>
                                </span>
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4 shrink-0 text-[#E8530E] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none',
                                        isStarting &&
                                            'animate-pulse motion-reduce:animate-none',
                                    )}
                                    weight="regular"
                                />
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
