import type { ReactNode } from 'react';

export function HubShell({
    list,
    main,
    side,
}: {
    list: ReactNode;
    main: ReactNode;
    side: ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-1 overflow-hidden border-t bg-[#f6f4ef] text-[13px] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
            <aside className="flex w-72 shrink-0 flex-col border-r bg-[#faf8f4] dark:bg-slate-900">{list}</aside>
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-950">{main}</section>
            <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l bg-[#faf8f4] dark:bg-slate-900">
                {side}
            </aside>
        </div>
    );
}

export function HubListRow({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full border-b px-3 py-2 text-left ${
                active ? 'bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
        >
            {children}
        </button>
    );
}

export function formatDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);
    return `${value.toLocaleString('fr-DZ')} DZD`;
}
