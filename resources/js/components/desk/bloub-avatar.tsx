import { cn } from '@/lib/utils';

export type BloubState = 'idle' | 'listen' | 'think' | 'speak';
export type BloubAvatarSize = 72 | 28 | 18 | 16;

const sizeClasses: Record<BloubAvatarSize, string> = {
    72: 'size-[72px]',
    28: 'size-7',
    18: 'size-[18px]',
    16: 'size-4',
};

const stateLabels: Record<BloubState, string> = {
    idle: 'waiting',
    listen: 'listening',
    think: 'thinking',
    speak: 'speaking',
};

type Props = {
    className?: string;
    label?: string;
    size?: BloubAvatarSize;
    state?: BloubState;
};

export function BloubAvatar({
    className,
    label,
    size = 72,
    state = 'idle',
}: Props) {
    const decorative = state === 'idle';
    const showSignal = state === 'listen' || state === 'speak';

    return (
        <div
            aria-hidden={decorative ? true : undefined}
            aria-label={
                decorative
                    ? undefined
                    : (label ?? `Bloub is ${stateLabels[state]}`)
            }
            className={cn(
                'relative grid shrink-0 place-items-center text-[#0D1B24]',
                sizeClasses[size],
                className,
            )}
            role={decorative ? undefined : 'img'}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'absolute inset-0 rounded-full border border-[#0D1B24]/10',
                    state === 'listen' &&
                        'border-2 border-[#0F4C5C] motion-safe:animate-pulse',
                    state === 'think' &&
                        'border-2 border-dashed border-[#0F4C5C] motion-safe:animate-spin',
                    state === 'speak' &&
                        'border-2 border-[#0F4C5C] motion-safe:animate-pulse',
                    'motion-reduce:animate-none',
                )}
            />

            {/* Legal: this is an original React/SVG drawing for EvoCRM, not an iframe or a 1:1 copy of x.ai's face or any third-party asset. */}
            <svg
                aria-hidden="true"
                className="relative size-full overflow-visible"
                fill="none"
                focusable="false"
                viewBox="0 0 72 72"
            >
                <path
                    d="M13 39.5C13 24.864 23.297 13 36 13s23 11.864 23 26.5c0 4.169-.85 8.166-2.382 11.078C53.398 55.146 45.79 59 36 59s-17.398-3.854-20.618-8.422C13.85 47.666 13 43.669 13 39.5Z"
                    fill="#0D1B24"
                />
                <path
                    d="M18.5 49.5C22.638 53.142 28.503 55 36 55s13.362-1.858 17.5-5.5"
                    stroke="#F7F8F5"
                    strokeLinecap="round"
                    strokeWidth="2.4"
                />
                <ellipse
                    cx="26.75"
                    cy="35.5"
                    fill="#F7F8F5"
                    rx="6.5"
                    ry="7.25"
                />
                <ellipse
                    cx="45.25"
                    cy="35.5"
                    fill="#F7F8F5"
                    rx="6.5"
                    ry="7.25"
                />
                <circle cx="28" cy="36" fill="#0D1B24" r="2.2" />
                <circle cx="44" cy="36" fill="#0D1B24" r="2.2" />
                <path
                    d={
                        state === 'think'
                            ? 'M31 47c2.4-1.45 7.6-1.45 10 0'
                            : state === 'speak'
                              ? 'M30 46.5c3.4 3 8.6 3 12 0'
                              : 'M31 47c2.4 1.55 7.6 1.55 10 0'
                    }
                    stroke="#F7F8F5"
                    strokeLinecap="round"
                    strokeWidth="2.4"
                />
                {showSignal ? (
                    <path
                        d="M62 28.5c2.3 2.2 3.5 4.7 3.5 7.5s-1.2 5.3-3.5 7.5"
                        stroke="#0F4C5C"
                        strokeLinecap="round"
                        strokeWidth="2"
                    />
                ) : null}
            </svg>
        </div>
    );
}
