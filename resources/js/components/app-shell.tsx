import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const isOpen = usePage().props.sidebarOpen; // sidebar_state cookie → P04 64/240 persist

    if (variant === 'header') {
        return (
            <div className="flex min-h-[100dvh] w-full flex-col bg-[var(--aurora-shell-bg)] font-sans">
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider
            defaultOpen={isOpen}
            className="min-h-[100dvh] bg-[var(--aurora-shell-bg)] font-sans"
        >
            {children}
        </SidebarProvider>
    );
}
