import type { Auth, PosthogShared, Workspace } from '@/types/auth';
import type { SharedIntegrations } from '@/types/integrations';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            workspace: Workspace | null;
            posthog: PosthogShared;
            integrations: SharedIntegrations;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
