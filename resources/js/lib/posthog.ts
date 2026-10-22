import { router } from '@inertiajs/react';
import posthog from 'posthog-js';

type PosthogPageConfig = {
    enabled?: boolean;
    key?: string | null;
    host?: string | null;
    distinct_id?: string | null;
    identify_pii?: boolean;
};

type Identity = {
    id: number;
    email: string;
    name: string;
    role?: string;
};

type WorkspaceIdentity = {
    id: number;
    name?: string | null;
    slug?: string | null;
};

let headersBound = false;

const SENSITIVE_KEY = /password|token|secret|api[_-]?key|authorization|cookie|access_token|refresh_token/i;

function redactProperties(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(redactProperties);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
                key,
                SENSITIVE_KEY.test(key) ? '[redacted]' : redactProperties(nested),
            ]),
        );
    }

    return value;
}

export function bootPosthog(config?: PosthogPageConfig | null): boolean {
    if (config && config.enabled === false) {
        return false;
    }

    const key = config?.key || (!config ? import.meta.env.VITE_POSTHOG_KEY : null);
    const host = config?.host || import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!key) {
        return false;
    }

    if (!posthog.__loaded) {
        posthog.init(key, {
            api_host: host,
            defaults: '2026-05-30',
            capture_pageview: true,
            capture_exceptions: true,
            person_profiles: 'identified_only',
            before_send: (event) => {
                if (!event) {
                    return event;
                }

                if (event.properties) {
                    event.properties = redactProperties(event.properties) as typeof event.properties;
                }

                return event;
            },
        });
    }

    bindPosthogHeaders();

    return true;
}

export function identifyWorkspaceUser(
    user?: Identity | null,
    workspace?: WorkspaceIdentity | null,
    identifyPii = false,
): void {
    if (!posthog.__loaded) {
        return;
    }

    if (!user) {
        posthog.reset();

        return;
    }

    posthog.identify(String(user.id), {
        ...(identifyPii ? { email: user.email, name: user.name } : {}),
        role: user.role,
    });

    if (workspace?.id) {
        posthog.group('workspace', String(workspace.id), {
            name: workspace.name ?? undefined,
            slug: workspace.slug ?? undefined,
        });
    }
}

function bindPosthogHeaders(): void {
    if (headersBound) {
        return;
    }

    headersBound = true;

    router.on('before', (event) => {
        if (!posthog.__loaded) {
            return;
        }

        event.detail.visit.headers = {
            ...event.detail.visit.headers,
            'X-POSTHOG-DISTINCT-ID': posthog.get_distinct_id(),
            'X-POSTHOG-SESSION-ID': posthog.get_session_id(),
        };
    });
}
