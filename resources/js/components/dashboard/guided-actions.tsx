import { Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type GuidedAction = {
    key: string;
    category: 'setup' | 'deal' | 'prospecting' | string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
};

const TABS = [
    { id: 'all', label: 'All actions' },
    { id: 'setup', label: 'Setup' },
    { id: 'deal', label: 'Deal related' },
    { id: 'prospecting', label: 'Prospecting' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function countFor(actions: GuidedAction[], tab: TabId): number {
    if (tab === 'all') {
        return actions.length;
    }

    return actions.filter((action) => action.category === tab).length;
}

export function GuidedActions({ actions }: { actions: GuidedAction[] }) {
    const [tab, setTab] = useState<TabId>('all');
    const visible = useMemo(
        () => (tab === 'all' ? actions : actions.filter((action) => action.category === tab)),
        [actions, tab],
    );

    return (
        <section aria-labelledby="guided-actions-heading">
            <header className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <h2
                    id="guided-actions-heading"
                    className="text-[13px] font-semibold tracking-tight text-ink"
                >
                    {t('Guided actions')}
                </h2>
            </header>

            <div
                role="tablist"
                aria-label={t('Guided action categories')}
                className="mb-3 flex flex-wrap gap-1"
            >
                {TABS.map((item) => {
                    const count = countFor(actions, item.id);
                    const selected = tab === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setTab(item.id)}
                            className={cn(
                                'rounded-md border px-2.5 py-1 text-[12px] transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                selected
                                    ? 'border-brand/40 bg-canvas-soft font-medium text-ink'
                                    : 'border-hairline text-mute hover:border-ink/20 hover:text-ink',
                            )}
                        >
                            {t(item.label)}
                            <span className="ms-1.5 money text-mute">{count}</span>
                        </button>
                    );
                })}
            </div>

            {visible.length === 0 ? (
                <p className="text-[13px] leading-5 text-mute" role="status">
                    {t('No actions in this category.')}
                </p>
            ) : (
                <ul className="divide-y divide-hairline">
                    {visible.map((action) => (
                        <li key={action.key} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-ink">{action.title}</p>
                                <p className="mt-0.5 text-[12px] leading-4 text-mute">
                                    {action.description}
                                </p>
                            </div>
                            <Link
                                href={action.href}
                                className="shrink-0 pt-0.5 text-[12px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                {action.actionLabel}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function CaughtUpStrip({
    caughtUp,
    sequencesHref = '/outbound/sequences',
}: {
    caughtUp: boolean;
    sequencesHref?: string;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-hairline bg-canvas-soft px-4 py-5 text-center">
                <p className="text-[13px] font-medium text-ink">
                    {caughtUp ? t("You're all caught up.") : t('Tasks still need you.')}
                </p>
                <Link
                    href="/crm/activities?type=task"
                    className="mt-2 inline-block text-[12px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                    {t('Manage tasks')}
                </Link>
            </div>
            <div className="rounded-md border border-hairline bg-canvas-soft px-4 py-5 text-center">
                <p className="text-[13px] font-medium text-ink">{t('Automate outreach')}</p>
                <p className="mt-1 text-[12px] text-mute">{t('Automate follow-up from your connected mailbox.')}</p>
                <Link
                    href={sequencesHref}
                    className="mt-2 inline-block text-[12px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                    {t('Manage sequences')}
                </Link>
            </div>
        </div>
    );
}
