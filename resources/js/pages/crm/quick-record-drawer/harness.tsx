import { Head } from '@inertiajs/react';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { RECORD_TYPES } from '@/ds/workspace/quick-record/types';
import { t } from '@/lib/i18n';

type Samples = Record<(typeof RECORD_TYPES)[number], number | null>;

/**
 * Local / testing host. Production web.php does not register this route.
 * Does not change list rowHref.
 */
export default function QuickRecordDrawerHarness({ samples }: { samples: Samples }) {
    const { openRecord, state } = useQuickRecord();

    return (
        <div className="mx-auto max-w-3xl px-6 py-8" data-ds="quick-record-drawer-harness">
            <Head title="P09 drawer harness" />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--evo-ink-muted)]">
                P09 harness
            </p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--evo-ink)]">
                {t('Quick record drawer')}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-[var(--evo-ink-secondary)]">
                Safe inspection host for the five CRM record types. Production lists still
                open the full record. This page is registered only in local and testing.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {RECORD_TYPES.map((type) => {
                    const id = samples[type];

                    return (
                        <button
                            key={type}
                            type="button"
                            disabled={!id}
                            onClick={(event) => {
                                if (!id) {
                                    return;
                                }

                                openRecord({ type, id }, { opener: event.currentTarget });
                            }}
                            className="rounded-lg border border-[var(--evo-hairline)] bg-white px-4 py-3 text-start hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] disabled:text-[var(--evo-ink-muted)]"
                        >
                            <span className="block text-[13px] font-medium capitalize text-[var(--evo-ink)]">
                                {type}
                            </span>
                            <span className="mt-1 block text-[12px] text-[var(--evo-ink-secondary)]">
                                {id ? `${type}:${id}` : t('No sample in this workspace')}
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="mt-6 text-[12px] text-[var(--evo-ink-muted)]">
                {state.open
                    ? `Open ${state.current ? `${state.current.type}:${state.current.id}` : '—'}`
                    : t('Drawer closed')}
            </p>
        </div>
    );
}
