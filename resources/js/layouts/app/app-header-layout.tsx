/**
 * @deprecated P02 — leftover Laravel starter-kit header shell.
 * Not wired by `AppLayout` (canonical: `app-sidebar-layout.tsx`).
 * Do not import. Delete in P28 after zero imports and tests allow.
 */
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header" className="bg-[var(--aurora-shell-bg)] font-sans">
                {children}
            </AppContent>
        </AppShell>
    );
}
