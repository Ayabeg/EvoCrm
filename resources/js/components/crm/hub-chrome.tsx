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
        <div className="flex h-[calc(100vh-52px)] min-h-0 flex-1 overflow-hidden border-t border-hairline bg-canvas-soft text-[13px] text-ink">
            <aside className="flex w-72 shrink-0 flex-col border-r border-hairline bg-canvas">{list}</aside>
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-canvas">{main}</section>
            <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-hairline bg-canvas">
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
                active
                    ? 'bg-canvas-soft shadow-[inset_2px_0_0_0_var(--color-brand)]'
                    : 'hover:bg-canvas-soft'
            }`}
        >
            {children}
        </button>
    );
}

export function formatDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);

    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0,
    }).format(value);
}
