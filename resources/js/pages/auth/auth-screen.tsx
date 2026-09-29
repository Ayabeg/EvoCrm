import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { t } from '@/lib/i18n';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

/**
 * Auth chrome for every `auth/*` page.
 *
 * Layout ports Astryx `login-split` from
 * `npx @astryxdesign/cli template login-split` (same source as
 * facebook/astryx `packages/cli/assets/templates/pages/login-split`):
 * a centered two-pane card that stacks on a narrow container. Astryx
 * Card/Grid/Center stay out — same StyleX conflict as the local
 * SegmentedControl. Form fields, Fortify POST, and SSO live in the
 * page, not here.
 *
 * Brand pane uses the EvoCrm mark, not the template's stock photo.
 * Apple/Google sit in the form (login page). Terms/Privacy sit under
 * the card. No placeholder vendor copy in this file.
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
        <div className="auth-screen flex min-h-[100dvh] flex-col items-center justify-center bg-canvas-soft px-4 py-8 sm:px-6 sm:py-12">
            <div className="login-split-wrap w-full max-w-[1000px]">
                <div
                    className="login-split-card overflow-hidden"
                    style={hairlineCardStyle}
                >
                    <div className="login-split-grid">
                        <section className="login-split-form flex min-w-0 flex-col">
                            <Link
                                href={home()}
                                className="flex items-center gap-2 text-ink"
                            >
                                <AppLogoIcon className="size-8" />
                                <span className="text-sm font-semibold tracking-tight">
                                    EvoCrm
                                </span>
                                <span className="sr-only">{t(title)}</span>
                            </Link>

                            <div className="flex flex-1 flex-col justify-center pt-8">
                                <h1 className="text-xl font-semibold tracking-tight text-balance text-ink">
                                    {t(title)}
                                </h1>
                                {description ? (
                                    <p className="mt-2 text-sm text-pretty text-mute">
                                        {t(description)}
                                    </p>
                                ) : null}
                                <div className="mt-6">{children}</div>
                            </div>
                        </section>

                        <div className="login-split-image">
                            <div
                                className="login-split-brand relative flex h-full min-h-[10.5rem] flex-col justify-end overflow-hidden bg-ink p-6 text-white sm:p-8"
                                aria-hidden="true"
                            >
                                <img
                                    src="/brand/evocrm/logo.svg"
                                    alt=""
                                    className="pointer-events-none absolute -top-8 -right-6 size-56 opacity-[0.22] sm:size-64"
                                />
                                <div className="relative">
                                    <h2 className="login-split-brand-name">
                                        EvoCrm
                                    </h2>
                                    <p className="login-split-brand-tagline mt-2 max-w-xs">
                                        {t(
                                            'Contacts, deals, inbox, and quotes. One login.',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="login-split-legal">
                    {t('By clicking continue, you agree to our')}{' '}
                    <Link href="/terms">{t('Terms of Service')}</Link>{' '}
                    {t('and')}{' '}
                    <Link href="/privacy">{t('Privacy Policy')}</Link>.
                </p>
            </div>
        </div>
    );
}
