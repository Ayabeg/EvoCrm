import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSelector } from '@/components/language-selector';
import { t } from '@/lib/i18n';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/**
 * Auth chrome for every `auth/*` page.
 *
 * Split login card: centered two-pane that stacks on a narrow container.
 * Surfaces and ink come from `--evo-*` tokens. Form fields, Fortify POST,
 * and SSO live in the page, not here.
 *
 * Brand pane uses the EvoCrm mark. Apple/Google sit in the form (login
 * page). Terms/Privacy sit under the card. No placeholder vendor copy.
 */
const hairlineCardStyle = {
    background: 'var(--evo-surface)',
    backgroundImage: 'none',
    borderColor: 'var(--evo-hairline)',
    borderRadius: 'var(--evo-radius-compact)',
    boxShadow: 'var(--evo-shadow-pill)',
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
                                    className="pointer-events-none absolute -top-8 -end-6 size-56 opacity-[0.22] sm:size-64"
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
                <div className="mt-6">
                    <LanguageSelector compact />
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
