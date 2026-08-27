import AuthScreen from '@/pages/auth/auth-screen';
import type { AuthLayoutProps } from '@/types';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: AuthLayoutProps) {
    return (
        <AuthScreen title={title} description={description}>
            {children}
        </AuthScreen>
    );
}
