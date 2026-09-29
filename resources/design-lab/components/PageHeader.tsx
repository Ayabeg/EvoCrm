import type { ReactNode } from 'react';

type Props = {
    eyebrow?: string;
    title: string;
    descriptor: string;
    context?: ReactNode;
    actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, descriptor, context, actions }: Props) {
    return (
        <header className="flex min-h-[68px] items-end justify-between gap-6 pb-5">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="mb-1 text-[12px] text-[var(--evo-ink-muted)]">{eyebrow}</p>
                ) : null}
                <h1 className="text-[26px] leading-none font-semibold tracking-[-0.03em] text-[var(--evo-ink)]">
                    {title}
                </h1>
                <p className="mt-2 text-[13px] text-[var(--evo-ink-muted)]">{descriptor}</p>
                {context ? <div className="mt-3 flex flex-wrap items-center gap-2">{context}</div> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
    );
}

type ChipProps = {
    children: ReactNode;
    active?: boolean;
    onClick?: () => void;
};

export function ContextChip({ children, active = false, onClick }: ChipProps) {
    const className = active
        ? 'border-[var(--evo-teal)] bg-[var(--evo-teal-soft)] text-[var(--evo-teal)]'
        : 'border-[var(--evo-hairline)] bg-white text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]';

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`h-7 rounded-[8px] border px-2.5 text-[12px] ${className}`}
            >
                {children}
            </button>
        );
    }

    return (
        <span className={`inline-flex h-7 items-center rounded-[8px] border px-2.5 text-[12px] ${className}`}>
            {children}
        </span>
    );
}
