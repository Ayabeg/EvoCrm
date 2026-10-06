import { AskEvoDrawer } from '@/components/crm/ask-evo-drawer';
import { HydrateI18n } from '@/components/i18n-provider';
import { PosthogIdentity } from '@/components/posthog-identity';
import { QuickRecordProvider } from '@/ds/workspace/quick-record';
import { QuickRecordDrawer } from '@/ds/workspace/QuickRecordDrawer';
// P0.1 light 224/56 shell. WorkspaceFrame mounts in app-sidebar-layout.
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
