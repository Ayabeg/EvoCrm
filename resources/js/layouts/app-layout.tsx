import { AskEvoDrawer } from '@/components/crm/ask-evo-drawer';
import { HydrateI18n } from '@/components/i18n-provider';
import { PosthogIdentity } from '@/components/posthog-identity';
import { QuickRecordProvider } from '@/ds/workspace/quick-record';
import { QuickRecordDrawer } from '@/ds/workspace/QuickRecordDrawer';
// Approved 212px production shell. Leftover header layout stays unwired (P02 / P28).
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <QuickRecordProvider>
            <HydrateI18n />
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                <PosthogIdentity />
                {children}
            </AppLayoutTemplate>
            <QuickRecordDrawer />
            <AskEvoDrawer />
        </QuickRecordProvider>
    );
}
