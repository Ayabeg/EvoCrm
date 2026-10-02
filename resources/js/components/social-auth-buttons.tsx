import { Button } from '@/evo/ui/button';
import { GOOGLE_MARK } from '@/evo/tokens/literal-hex';
import { t } from '@/lib/i18n';

function AppleMark({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
        >
            <path
                fill="currentColor"
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
            />
        </svg>
    );
}

function GoogleMark({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
        >
            <path
                fill={GOOGLE_MARK.blue}
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
                fill={GOOGLE_MARK.green}
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
            />
            <path
                fill={GOOGLE_MARK.yellow}
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
            />
            <path
                fill={GOOGLE_MARK.red}
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
            />
        </svg>
    );
}

/**
 * Astryx login-split SSO row: divider, then Apple | Google.
 * Google always hits the existing /auth/google Fortify flow.
 * Apple always hits /auth/apple (unconfigured → login status, never 500).
 */
export default function SocialAuthButtons() {
    return (
        <div className="login-split-sso">
            <p className="login-split-sso-divider">
                <span>{t('Or continue with')}</span>
            </p>
            <div className="login-split-sso-grid">
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    asChild
                >
                    <a href="/auth/apple" data-test="apple-login-button">
                        <AppleMark className="h-4 w-4" />
                        {t('Apple')}
                    </a>
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    asChild
                >
                    <a href="/auth/google" data-test="google-login-button">
                        <GoogleMark className="h-4 w-4" />
                        {t('Google')}
                    </a>
                </Button>
            </div>
        </div>
    );
}
