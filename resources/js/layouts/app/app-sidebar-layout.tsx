import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { CrmShell } from '@/components/crm/crm-shell';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();
    const pathname = url.split('?')[0] ?? '';
    const isHome =
        pathname === '/home' || pathname === '/dashboard' || pathname === '/';

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="aurora-page-shell min-w-0 overflow-x-clip !bg-[var(--aurora-shell-bg)] font-sans"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {isHome ? (
                    <CrmShell title="Home" chrome="room">
                        {children}
                    </CrmShell>
                ) : (
                    children
                )}
            </AppContent>
        </AppShell>
    );
}
