import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { bootPosthog, identifyWorkspaceUser } from '@/lib/posthog';

type SharedPosthog = {
    posthog?: {
        enabled?: boolean;
        key?: string | null;
        host?: string | null;
        distinct_id?: string | null;
    };
    auth?: {
        user?: {
            id: number;
            email: string;
            name: string;
            role?: string;
        } | null;
    };
    workspace?: {
        id: number;
        name?: string | null;
        slug?: string | null;
    } | null;
};

export function PosthogIdentity() {
    const { posthog, auth, workspace } = usePage<SharedPosthog>().props;

    useEffect(() => {
        if (!bootPosthog(posthog)) {
            return;
        }

        identifyWorkspaceUser(auth?.user, workspace, posthog?.identify_pii === true);
    }, [posthog, auth?.user, workspace]);

    return null;
}
