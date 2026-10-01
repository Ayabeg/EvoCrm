import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: ReactNode;
};

export function Button({ variant = 'secondary', className = '', children, ...props }: Props) {
    const look =
        variant === 'primary'
            ? 'bg-[var(--evo-primary)] text-[var(--evo-on-primary)] hover:brightness-[1.04]'
            : variant === 'ghost'
                ? 'bg-transparent text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                : 'border border-[var(--evo-hairline)] bg-white text-[var(--evo-ink)] hover:bg-[var(--evo-hover)]';

    return (
        <button
            type="button"
            className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${look} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
