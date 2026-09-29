import { CaretLeft, Sidebar } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { owners } from '../data/evocrm-demo-data';
import { NAV_SECTIONS } from '../lib/nav';
import { roomOf } from '../lib/routes';
import type { LabRoute } from '../lib/routes';
import { LabLink } from './LabLink';

const STORAGE_KEY = 'evocrm-lab-sidebar-collapsed';

type Props = {
    route: LabRoute;
    children: ReactNode;
};

function readCollapsed(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function LabShell({ route, children }: Props) {
    const [collapsed, setCollapsed] = useState(readCollapsed);
    const room = roomOf(route);
    const user = owners[0];
    const childView =
        route.name === 'outbound' || route.name === 'ads' || route.name === 'reports'
            ? route.view ?? 'overview'
            : route.name === 'campaign'
                ? 'campaigns'
                : null;

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    }, [collapsed]);

    return (
        <div className="lab-shell flex min-h-[100dvh] bg-[var(--evo-canvas)]" data-collapsed={collapsed}>
            <div className="lab-rail relative hidden shrink-0 md:block">
                <aside className="lab-rail-panel fixed inset-y-0 left-0 z-20 flex h-[100dvh] flex-col border-r border-[var(--evo-hairline)] bg-white">
                    <div className="flex h-[64px] items-center justify-between px-4">
                        <div className="min-w-0">
                            <p className="text-[11px] tracking-[0.04em] text-[var(--evo-ink-muted)]">
                                Evotechly
                            </p>
                            <p className="text-[15px] font-semibold tracking-[-0.02em]">EvoCRM</p>
                        </div>
                        <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-[8px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)]"
                            aria-label="Réduire la navigation"
                            onClick={() => setCollapsed(true)}
                        >
                            <CaretLeft size={16} />
                        </button>
                    </div>

                    <nav className="lab-scrollbar flex-1 overflow-y-auto px-2 pb-4" aria-label="EvoCRM">
                        {NAV_SECTIONS.map((section) => (
                            <div key={section.id} className={section.label ? 'mt-5' : 'mt-1'}>
                                {section.label ? (
                                    <p className="px-2 pb-1 text-[10px] font-medium tracking-[0.08em] text-[var(--evo-ink-faint)] uppercase">
                                        {section.label}
                                    </p>
                                ) : null}
                                <div className="flex flex-col gap-0.5">
                                    {section.items.map((item) => {
                                        const active = room === item.id;
                                        const showChildren = Boolean(item.children && active);

                                        return (
                                            <div key={item.id}>
                                                <LabLink
                                                    to={item.to}
                                                    className={
                                                        active
                                                            ? 'flex h-8 items-center rounded-[8px] bg-[var(--evo-teal-soft)] px-2.5 text-[13px] font-medium text-[var(--evo-teal)]'
                                                            : 'flex h-8 items-center rounded-[8px] px-2.5 text-[13px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                                                    }
                                                >
                                                    {item.label}
                                                </LabLink>
                                                {showChildren ? (
                                                    <div className="mt-0.5 mb-1 ml-2 border-l border-[var(--evo-hairline)] pl-2">
                                                        {item.children?.map((child) => {
                                                            const childActive = childView === child.id;

                                                            return (
                                                                <LabLink
                                                                    key={child.id}
                                                                    to={child.to}
                                                                    className={
                                                                        childActive
                                                                            ? 'flex h-7 items-center rounded-[6px] px-2 text-[12px] font-medium text-[var(--evo-teal)]'
                                                                            : 'flex h-7 items-center rounded-[6px] px-2 text-[12px] text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)] hover:text-[var(--evo-ink)]'
                                                                    }
                                                                >
                                                                    {child.label}
                                                                </LabLink>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="border-t border-[var(--evo-hairline)] px-3 py-3">
                        <LabLink
                            to={{ name: 'settings' }}
                            className={
                                room === 'settings'
                                    ? 'flex h-8 items-center rounded-[8px] bg-[var(--evo-teal-soft)] px-2 text-[13px] font-medium text-[var(--evo-teal)]'
                                    : 'flex h-8 items-center rounded-[8px] px-2 text-[13px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                            }
                        >
                            Paramètres
                        </LabLink>
                        <div className="mt-1 flex items-center gap-2 px-2 py-1.5">
                            <span className="flex size-6 items-center justify-center rounded-[6px] bg-[var(--evo-teal)] text-[10px] font-semibold text-white">
                                {user.initials}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-medium">{user.name}</p>
                                <p className="text-[10px] tracking-[0.06em] text-[var(--evo-ink-faint)]">
                                    DEMO · SEPT 2026
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <div className="lab-workspace relative flex min-w-0 flex-1 flex-col">
                <button
                    type="button"
                    className="lab-reopen absolute top-3 left-3 z-30 hidden size-8 items-center justify-center rounded-[8px] border border-[var(--evo-hairline)] bg-white text-[var(--evo-teal)] shadow-[0_1px_2px_rgba(13,27,36,0.08)] md:flex"
                    aria-label="Ouvrir la navigation"
                    onClick={() => setCollapsed(false)}
                >
                    <Sidebar size={16} weight="bold" />
                </button>
                <nav
                    className="flex gap-1 overflow-x-auto border-b border-[var(--evo-hairline)] px-3 py-2 md:hidden"
                    aria-label="Mobile"
                >
                    {NAV_SECTIONS.flatMap((section) => section.items).map((item) => (
                        <LabLink
                            key={item.id}
                            to={item.to}
                            className={
                                room === item.id
                                    ? 'rounded-[8px] bg-[var(--evo-teal)] px-3 py-1 text-[12px] text-white'
                                    : 'rounded-[8px] px-3 py-1 text-[12px] text-[var(--evo-ink-muted)]'
                            }
                        >
                            {item.label}
                        </LabLink>
                    ))}
                </nav>
                <main
                    className={`lab-scrollbar min-w-0 flex-1 overflow-auto px-5 py-4 md:px-8 md:py-5 ${collapsed ? 'md:pl-14' : ''}`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
