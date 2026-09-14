import { HydrateI18n } from '@/components/i18n-provider';
import { PosthogIdentity } from '@/components/posthog-identity';
import AuthScreen from '@/pages/auth/auth-screen';
import type { AuthLayoutProps } from '@/types';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: AuthLayoutProps) {
    return (
        <>
            <HydrateI18n />
            <AuthScreen title={title} description={description}>
                <PosthogIdentity />
                {children}
            </AuthScreen>
        </>
    );
}
