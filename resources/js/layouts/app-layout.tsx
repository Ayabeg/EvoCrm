import { HydrateI18n } from '@/components/i18n-provider';
import { PosthogIdentity } from '@/components/posthog-identity';
// Canonical 64/240 product shell. Leftover header layout stays unwired (P02 / P28).
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
        <>
            <HydrateI18n />
            <AppLayoutTemplate breadcrumbs={breadcrumbs}>
                <PosthogIdentity />
                {children}
            </AppLayoutTemplate>
        </>
    );
}
