import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/**
 * Auth chrome for every `auth/*` page.
 * Aurora Card + Brand Book identity. Hairline only — no mesh, no shell wash.
 */
const hairlineCardStyle = {
    background: 'var(--evosales-canvas)',
    backgroundImage: 'none',
    borderColor: 'var(--evosales-hairline)',
    borderRadius: 'var(--radius-2)',
    boxShadow: 'none',
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
                    <span className="aurora-text-ui tracking-tight">
                        EvoSales
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
