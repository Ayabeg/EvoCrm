import {
    AddressBook,
    Clock,
    Funnel,
    Handshake,
    MagnifyingGlass,
    SquaresFour,
    Tray,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyKind =
    | 'contacts'
    | 'deals'
    | 'pipeline'
    | 'activity'
    | 'filter'
    | 'generic';

export function inferEmptyKind(title: string): EmptyKind {
    const value = title.toLowerCase();

    if (value.includes('match') || value.includes('filter')) {
        return 'filter';
    }

    if (value.includes('contact')) {
        return 'contacts';
    }

    if (value.includes('pipeline')) {
        return 'pipeline';
    }

    if (value.includes('deal') || value.includes('opportunit')) {
        return 'deals';
    }

    if (
        value.includes('recent') ||
        value.includes('activity') ||
        value.includes('attention')
    ) {
        return 'activity';
    }

    return 'generic';
}

function Frame({
    children,
    size,
    className,
}: {
    children: ReactNode;
    size: 'sm' | 'md';
    className?: string;
}) {
    const dim = size === 'sm' ? 64 : 104;

    return (
        <span
            aria-hidden
            data-empty-illustration=""
            className={cn(
                'relative inline-flex items-center justify-center text-ink',
                className,
            )}
            style={{
                width: dim,
                height: dim,
                background: 'var(--color-bg)',
                border: '1.5px dashed color-mix(in srgb, var(--evosales-ink, #000) 16%, var(--evosales-hairline, #d4d4d4))',
                borderRadius: 2,
            }}
        >
            <span
                className="absolute top-1 left-1 h-2 w-2 border-t border-l"
                style={{ borderColor: 'var(--color-accent)' }}
            />
            <span
                className="absolute right-1 bottom-1 h-2 w-2 border-r border-b"
                style={{ borderColor: 'var(--color-accent)' }}
            />
            {children}
        </span>
    );
}

function ContactsMark({ size }: { size: 'sm' | 'md' }) {
    const icon = size === 'sm' ? 22 : 32;

    return (
        <span className="relative inline-flex">
            <AddressBook size={icon} weight="regular" />
            <span
                className="absolute -right-2 -bottom-1.5 flex items-center justify-center bg-canvas"
                style={{
                    width: size === 'sm' ? 16 : 20,
                    height: size === 'sm' ? 16 : 20,
                }}
            >
                <Tray
                    size={size === 'sm' ? 12 : 16}
                    weight="regular"
                    className="text-brand"
                />
            </span>
        </span>
    );
}

function DealsMark({ size }: { size: 'sm' | 'md' }) {
    const icon = size === 'sm' ? 22 : 32;

    return (
        <span className="relative inline-flex flex-col items-center">
            <Handshake size={icon} weight="regular" />
            <span
                className="mt-1 h-px w-6"
                style={{ background: 'var(--color-accent)' }}
            />
        </span>
    );
}

function PipelineMark({ size }: { size: 'sm' | 'md' }) {
    const h = size === 'sm' ? 22 : 34;
    const bars = [0.55, 0.9, 0.4];

    return (
        <span className="inline-flex items-end gap-1" style={{ height: h }}>
            {bars.map((ratio, index) => (
                <span
                    key={index}
                    className="w-1.5 border border-current"
                    style={{
                        height: `${Math.round(h * ratio)}px`,
                        background:
                            index === 1
                                ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                                : 'transparent',
                    }}
                />
            ))}
        </span>
    );
}

function ActivityMark({ size }: { size: 'sm' | 'md' }) {
    return <Clock size={size === 'sm' ? 22 : 32} weight="regular" />;
}

function FilterMark({ size }: { size: 'sm' | 'md' }) {
    const icon = size === 'sm' ? 20 : 28;

    return (
        <span className="relative inline-flex">
            <Funnel size={icon} weight="regular" />
            <MagnifyingGlass
                size={size === 'sm' ? 12 : 16}
                weight="bold"
                className="absolute -right-2 -bottom-1 text-brand"
            />
        </span>
    );
}

function GenericMark({ size }: { size: 'sm' | 'md' }) {
    return <SquaresFour size={size === 'sm' ? 22 : 32} weight="regular" />;
}

const MARKS: Record<EmptyKind, (props: { size: 'sm' | 'md' }) => ReactNode> = {
    contacts: ContactsMark,
    deals: DealsMark,
    pipeline: PipelineMark,
    activity: ActivityMark,
    filter: FilterMark,
    generic: GenericMark,
};

export function EmptyIllustration({
    kind = 'generic',
    size = 'md',
    className,
}: {
    kind?: EmptyKind;
    size?: 'sm' | 'md';
    className?: string;
}) {
    const Mark = MARKS[kind] ?? GenericMark;

    return (
        <Frame size={size} className={className}>
            <Mark size={size} />
        </Frame>
    );
}
