import {
    ChartBar,
    Envelope,
    FileText,
    Handshake,
    House,
    Megaphone,
    UserList,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { DEMO_PERIOD, DEMO_WORKSPACE, KNOWN_OBJECT_IDS } from '../data/evocrm-demo-data';
import { labHref } from '../lib/routes';
import type { LabRoute } from '../lib/routes';
import { LabLink } from './LabLink';

const NAV: Array<{
    to: LabRoute;
    label: string;
    icon: typeof House;
    match: LabRoute['name'][];
}> = [
    { to: { name: 'accueil' }, label: 'Accueil', icon: House, match: ['accueil'] },
    { to: { name: 'ads' }, label: 'Ads Hub', icon: Megaphone, match: ['ads'] },
    { to: { name: 'contacts' }, label: 'Contacts', icon: UserList, match: ['contacts', 'contact'] },
    { to: { name: 'deal', id: KNOWN_OBJECT_IDS.dealModernisationCrm }, label: 'Deal', icon: Handshake, match: ['deal'] },
    { to: { name: 'devis', id: KNOWN_OBJECT_IDS.quoteDv20260047 }, label: 'Devis', icon: FileText, match: ['devis'] },
    { to: { name: 'reports' }, label: 'Reports', icon: ChartBar, match: ['reports'] },
];

type Props = {
    route: LabRoute;
    title: string;
    children: ReactNode;
};

export function LabShell({ route, title, children }: Props) {
    return (
        <div className="flex min-h-[100dvh] bg-[var(--evo-canvas)] text-[var(--evo-ink)]">
            <aside className="sticky top-0 hidden h-[100dvh] w-[220px] shrink-0 flex-col border-r border-[var(--evo-border)] bg-[var(--evo-surface)] md:flex">
                <div className="flex h-[52px] items-center gap-2 border-b border-[var(--evo-border)] px-4">
                    <img src="/brand/evocrm/logo.svg" alt="" width={22} height={22} />
                    <div>
                        <p className="text-[13px] font-semibold">EvoCRM</p>
                        <p className="text-[11px] text-[var(--evo-ink-muted)]">Design Lab</p>
                    </div>
                </div>
                <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Design Lab">
                    {NAV.map((item) => {
                        const active = item.match.includes(route.name);
                        const Icon = item.icon;

                        return (
                            <LabLink
                                key={item.label}
                                to={item.to}
                                className={
                                    active
                                        ? 'flex items-center gap-2 rounded-[8px] bg-[var(--evo-teal-soft)] px-2.5 py-2 text-[13px] font-medium text-[var(--evo-teal)]'
                                        : 'flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                                }
                            >
                                <Icon size={16} weight={active ? 'fill' : 'regular'} />
                                {item.label}
                            </LabLink>
                        );
                    })}
                </nav>
                <p className="border-t border-[var(--evo-border)] px-4 py-3 text-[11px] text-[var(--evo-ink-faint)]">
                    Compte démo {DEMO_PERIOD.label}
                </p>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-[52px] items-center justify-between border-b border-[var(--evo-border)] bg-[var(--evo-surface)] px-4">
                    <div className="min-w-0">
                        <h1 className="truncate text-[16px] font-semibold">{title}</h1>
                        <p className="truncate text-[12px] text-[var(--evo-ink-muted)]">
                            {DEMO_WORKSPACE.name} · {DEMO_PERIOD.label} · Africa/Algiers
                        </p>
                    </div>
                    <p className="hidden items-center gap-1 text-[12px] text-[var(--evo-ink-muted)] sm:flex">
                        <Envelope size={14} />
                        Données figées septembre 2026
                    </p>
                </header>
                <nav className="flex gap-1 overflow-x-auto border-b border-[var(--evo-border)] px-3 py-2 md:hidden" aria-label="Mobile">
                    {NAV.map((item) => (
                        <LabLink
                            key={item.label}
                            to={item.to}
                            className={
                                item.match.includes(route.name)
                                    ? 'rounded-full bg-[var(--evo-teal)] px-3 py-1 text-[12px] text-white'
                                    : 'rounded-full px-3 py-1 text-[12px] text-[var(--evo-ink-muted)]'
                            }
                        >
                            {item.label}
                        </LabLink>
                    ))}
                </nav>
                <main className="lab-scrollbar min-w-0 flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
                <p className="sr-only">{labHref(route)}</p>
            </div>
        </div>
    );
}
