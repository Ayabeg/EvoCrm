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
            locale: string;
            dir: 'ltr' | 'rtl';
            intlLocale: string;
            translations: Record<string, string>;
            auth: Auth;
            workspace: Workspace | null;
            simpleMode: boolean;
            nav: Array<{ id: string; label: string; href: string }>;
            features: {
                tickets: boolean;
                sms: boolean;
                ask_evo: boolean;
                ads: boolean;
                warmup: boolean;
                report_builder: boolean;
            };
            posthog: PosthogShared;
            integrations: SharedIntegrations;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
