import { HydrateI18n } from '@/components/i18n-provider';
import { PosthogIdentity } from '@/components/posthog-identity';
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
