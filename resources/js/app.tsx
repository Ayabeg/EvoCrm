import { Theme } from '@astryxdesign/core/theme';
import { createInertiaApp } from '@inertiajs/react';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
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
        return (
            <Theme theme={neutralTheme}>
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </Theme>
        );
    },
    progress: {
        color: '#E8530E',
    },
});

// Light Cabinet only — strips any stale dark preference on load.
initializeTheme();
