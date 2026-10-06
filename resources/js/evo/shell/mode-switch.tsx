import type { KeyboardEvent } from 'react';
import type { Icon } from '@/evo/icons';
import { List, MagnifyingGlass, StarFour } from '@/evo/icons';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Retired from the live rail in P0.1. Agents is a Full-mode nav row. */
export type ShellMode = 'menu' | 'agents' | 'search';

export const SHELL_MODES: { id: ShellMode; label: string; icon: Icon }[] = [
    { id: 'menu', label: 'Menu', icon: List },
    { id: 'agents', label: 'Agents', icon: StarFour },
    { id: 'search', label: 'Search', icon: MagnifyingGlass },
];

type Props = {
    mode: ShellMode;
    onModeChange: (mode: ShellMode) => void;
};

export function ShellModeSwitch({ mode, onModeChange }: Props) {
    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const current = SHELL_MODES.findIndex((item) => item.id === mode);
        let next = current;

        const rtl =
            typeof document !== 'undefined' &&
            document.documentElement.dir === 'rtl';
        const goNext =
            event.key === 'ArrowDown' ||
            event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
        const goPrev =
            event.key === 'ArrowUp' ||
            event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');

        if (goNext) {
            next = (current + 1) % SHELL_MODES.length;
        } else if (goPrev) {
            next = (current - 1 + SHELL_MODES.length) % SHELL_MODES.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = SHELL_MODES.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        const nextMode = SHELL_MODES[next]?.id;

        if (nextMode) {
            onModeChange(nextMode);
        }
    }

    return (
        <div
            role="tablist"
            aria-label={t('Sidebar mode')}
            className="flex gap-0.5 rounded-[8px] bg-[var(--evo-surface-raised)] p-0.5"
            onKeyDown={onKeyDown}
        >
            {SHELL_MODES.map((item) => {
                const Icon = item.icon;
                const selected = mode === item.id;
                const label = t(item.label);

                return (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        id={`shell-tab-${item.id}`}
                        aria-label={label}
                        aria-selected={selected}
                        aria-controls={`shell-panel-${item.id}`}
                        tabIndex={selected ? 0 : -1}
                        className={cn(
                            'inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-focus)]',
                            selected
                                ? 'min-w-0 flex-1 bg-[var(--evo-teal-soft)] px-2 text-[var(--evo-ink)]'
                                : 'text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]',
                        )}
                        onClick={() => onModeChange(item.id)}
                    >
                        <Icon
                            aria-hidden
                            className="size-4 shrink-0"
                            weight={selected ? 'bold' : 'regular'}
                        />
                        {selected ? (
                            <span className="whitespace-nowrap">{label}</span>
                        ) : (
                            <span className="sr-only">{label}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
