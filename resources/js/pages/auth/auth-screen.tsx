import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

/**
 * Auth chrome for every `auth/*` page.
 * Aurora Card + Brand Book identity. Hairline only — no mesh, no shell wash.
 */
const hairlineCardStyle = {
    background: '#ffffff',
    backgroundImage: 'none',
    borderColor: 'var(--evosales-hairline)',
    borderRadius: '4px',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.04)',
} as const;

export default function AuthScreen({
    title = '',
    description = '',
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas-soft px-4 py-12 sm:px-6">
            <div className="flex w-full max-w-[400px] flex-col items-center gap-10">
                <Link
                    href={home()}
                    className="flex flex-col items-center gap-3 text-ink"
                >
                    <AppLogoIcon className="size-9" />
                    <span className="text-sm font-semibold tracking-tight text-ink">
                        EvoCrm
                    </span>
                    <span className="sr-only">{title}</span>
                </Link>

                <Card
                    elevated={false}
                    className="w-full"
                    style={hairlineCardStyle}
                >
                    <CardHeader
                        className="border-0 px-8 pt-8 pb-0 text-center"
                        style={{ borderColor: 'transparent' }}
                    >
                        <h1 className="aurora-text-display-1 text-balance">
                            {title}
                        </h1>
                        {description ? (
                            <p
                                className="aurora-text-body-sm mt-2 text-pretty"
                                style={{ color: 'var(--evosales-mute)' }}
                            >
                                {description}
                            </p>
                        ) : null}
                    </CardHeader>
                    <CardContent className="px-8 pt-6 pb-8">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
