import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/evo/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import PublicLayout from '@/layouts/public-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = 'EvoCrm';

createInertiaApp({
    title: (title) =>
        title && title !== appName ? `${title} · ${appName}` : appName,
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name.startsWith('public/'):
                return PublicLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return <AppProviders>{app}</AppProviders>;
    },
    progress: {
        color: 'var(--evo-primary)',
    },
});

function AppProviders({ children }: { children: ReactNode }) {
    return (
        <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
        </TooltipProvider>
    );
}

initializeTheme();
