import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { bootPosthog, identifyWorkspaceUser } from '@/lib/posthog';
import { t } from '@/lib/i18n';

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
    const isPublic = !auth?.user;
    const [consent, setConsent] = useState<'unknown' | 'granted' | 'denied'>('unknown');

    useEffect(() => {
        if (!isPublic) {
            return;
        }

        const saved = window.localStorage.getItem('evocrm.analytics_consent');
        if (saved === 'granted' || saved === 'denied') {
            setConsent(saved);
        }
    }, [isPublic]);

    useEffect(() => {
        if (isPublic && consent !== 'granted') {
            return;
        }

        if (!bootPosthog(posthog)) {
            return;
        }

        identifyWorkspaceUser(auth?.user, workspace, posthog?.identify_pii === true);
    }, [consent, isPublic, posthog, auth?.user, workspace]);

    if (!isPublic || consent !== 'unknown') {
        return null;
    }

    const choose = (value: 'granted' | 'denied') => {
        window.localStorage.setItem('evocrm.analytics_consent', value);
        setConsent(value);
    };

    return (
        <aside
            aria-label={t('Analytics consent')}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-[var(--evo-radius-card)] border border-[var(--evo-hairline)] bg-[var(--evo-panel)] p-4 text-[13px] shadow-[var(--evo-shadow-card)]"
        >
            <p className="text-[var(--evo-ink-muted)]">
                {t('Allow anonymous analytics to help us improve EvoCRM?')}
            </p>
            <div className="flex shrink-0 gap-2">
                <button
                    type="button"
                    className="rounded-[var(--evo-radius-compact)] px-3 py-2 text-[var(--evo-ink-muted)] hover:bg-[var(--evo-canvas)]"
                    onClick={() => choose('denied')}
                >
                    {t('Decline')}
                </button>
                <button
                    type="button"
                    className="rounded-[var(--evo-radius-compact)] bg-[var(--evo-teal)] px-3 py-2 font-medium text-white hover:opacity-90"
                    onClick={() => choose('granted')}
                >
                    {t('Allow')}
                </button>
            </div>
        </aside>
    );
}
