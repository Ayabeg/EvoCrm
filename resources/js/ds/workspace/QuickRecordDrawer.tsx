import { ArrowLeft, ArrowSquareOut, X } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
} from '@/evo/ui/drawer';
import { useQuickRecord } from '@/ds/workspace/quick-record/context';
import type {
    KeyProperty,
    RecordActivityItem,
    RecordAssociation,
    RecordCapabilities,
    RecordDescriptor,
    RecordStatusTone,
} from '@/ds/workspace/quick-record/types';
import { EMPTY_VALUE } from '@/ds/workspace/record-adapters/present';
import { handleQuickRecordEscapeKeyDown } from '@/lib/command-os';
import { attentionToneClass } from '@/lib/deal-attention';
import { t } from '@/lib/i18n';
import { MOTION_DRAWER_CLASS } from '@/lib/motion';
import { PAGE_OVERFLOW_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

type SectionId = 'overview' | 'activity' | 'notes' | 'tasks' | 'associations';

const SECTION_LABELS: Record<SectionId, string> = {
    overview: 'Overview',
    activity: 'Activity',
    notes: 'Notes',
    tasks: 'Tasks',
    associations: 'Associations',
};

const TONE_CLASS: Record<RecordStatusTone, string> = {
    neutral: 'bg-[var(--evo-surface-subtle)] text-[var(--evo-ink-secondary)]',
    success: 'bg-[var(--evo-success-soft)] text-[var(--evo-success)]',
    warning: 'bg-[var(--evo-warning-soft)] text-[var(--evo-warning)]',
    danger: 'bg-[var(--evo-danger-soft)] text-[var(--evo-danger)]',
};

function visibleSections(capabilities: RecordCapabilities | undefined): SectionId[] {
    const sections: SectionId[] = [];

    if (!capabilities || capabilities.overview) {
        sections.push('overview');
    }

    if (capabilities?.activity) {
        sections.push('activity');
    }

    if (capabilities?.notes) {
        sections.push('notes');
    }

    if (capabilities?.tasks) {
        sections.push('tasks');
    }

    if (capabilities?.associations) {
        sections.push('associations');
    }

    return sections.length > 0 ? sections : ['overview'];
}

function StatusPill({ label, tone }: { label: string; tone?: RecordStatusTone }) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium',
                TONE_CLASS[tone ?? 'neutral'],
            )}
        >
            {label}
        </span>
    );
}

function PropertyRow({ property }: { property: KeyProperty }) {
    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-1.5">
            <dt className="text-[12px] text-[var(--evo-ink-secondary)]">{property.label}</dt>
            <dd className="min-w-0 truncate text-[13px] text-[var(--evo-ink)]" title={property.value ?? undefined}>
                {property.value ?? EMPTY_VALUE}
            </dd>
        </div>
    );
}

function ActivityList({ items, empty }: { items: RecordActivityItem[]; empty: string }) {
    if (items.length === 0) {
        return <p className="text-[13px] text-[var(--evo-ink-muted)]">{empty}</p>;
    }

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.id} className="min-w-0 border-b border-[var(--evo-surface-subtle)] pb-3 last:border-0 last:pb-0">
                    <p className="truncate text-[13px] font-medium text-[var(--evo-ink)]" title={item.title}>
                        {item.title}
                    </p>
                    {item.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--evo-ink-secondary)]">{item.body}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--evo-ink-muted)]">
                        {[item.type, item.owner].filter(Boolean).join(' · ')}
                    </p>
                </li>
            ))}
        </ul>
    );
}

function AssociationList({
    items,
    onOpen,
}: {
    items: RecordAssociation[];
    onOpen: (ref: RecordAssociation['ref']) => void;
}) {
    if (items.length === 0) {
        return <p className="text-[13px] text-[var(--evo-ink-muted)]">{t('No associations')}</p>;
    }

    return (
        <ul className="space-y-1">
            {items.map((item) => (
                <li key={`${item.ref.type}:${item.ref.id}`}>
                    <button
                        type="button"
                        onClick={() => onOpen(item.ref)}
                        className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                    >
                        <span className="min-w-0">
                            <span className="block truncate text-[13px] text-[var(--evo-ink)]">{item.label}</span>
                            <span className="block text-[11px] capitalize text-[var(--evo-ink-muted)]">
                                {item.hint ?? item.ref.type}
                            </span>
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function DrawerSkeleton() {
    return (
        <div className="space-y-4" aria-hidden>
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[var(--evo-surface-subtle)]" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-[var(--evo-surface-subtle)]" />
                    <div className="h-3 w-1/3 rounded bg-[var(--evo-surface-subtle)]" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="h-7 w-20 rounded-full bg-[var(--evo-surface-subtle)]" />
                <div className="h-7 w-16 rounded-full bg-[var(--evo-surface-subtle)]" />
                <div className="h-7 w-24 rounded-full bg-[var(--evo-surface-subtle)]" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full rounded bg-[var(--evo-surface-subtle)]" />
                <div className="h-3 w-5/6 rounded bg-[var(--evo-surface-subtle)]" />
                <div className="h-3 w-4/6 rounded bg-[var(--evo-surface-subtle)]" />
                <div className="h-3 w-3/5 rounded bg-[var(--evo-surface-subtle)]" />
            </div>
        </div>
    );
}

function HeaderIdentity({ descriptor }: { descriptor: RecordDescriptor | null }) {
    if (!descriptor) {
        return (
            <div>
                <DrawerTitle className="text-[16px] font-semibold tracking-tight text-[var(--evo-ink)]">
                    {t('Record')}
                </DrawerTitle>
                <DrawerDescription className="text-[12px] text-[var(--evo-ink-secondary)]">{t('Loading')}</DrawerDescription>
            </div>
        );
    }

    return (
        <div className="flex min-w-0 items-start gap-3">
            <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--evo-surface-subtle)] text-[12px] font-medium text-[var(--evo-ink)]"
                aria-hidden
            >
                {descriptor.avatar?.initials ?? '?'}
            </div>
            <div className="min-w-0">
                <DrawerTitle className="truncate text-[16px] font-semibold tracking-tight text-[var(--evo-ink)]">
                    {descriptor.title}
                </DrawerTitle>
                <DrawerDescription className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-[var(--evo-ink-secondary)]">
                    {descriptor.subtitle ? <span className="truncate">{descriptor.subtitle}</span> : null}
                    {descriptor.status ? (
                        <StatusPill label={descriptor.status.label} tone={descriptor.status.tone} />
                    ) : null}
                    {descriptor.owner ? <span className="truncate">{descriptor.owner.name}</span> : null}
                </DrawerDescription>
            </div>
        </div>
    );
}

export function QuickRecordDrawer() {
    const { state, close, back, replace, retry, openFull } = useQuickRecord();
    const { open, descriptor, status, error, history } = state;
    const sections = useMemo(() => visibleSections(descriptor?.capabilities), [descriptor?.capabilities]);
    const [requestedSection, setSection] = useState<SectionId>('overview');
    const section = sections.includes(requestedSection) ? requestedSection : (sections[0] ?? 'overview');

    const accessibleName = descriptor?.title ?? t('Quick record');

    return (
        <Drawer
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    close();
                }
            }}
        >
            <DrawerContent
                side="right"
                hideClose
                data-ds="quick-record-drawer"
                overlayClassName="bg-black/20"
                overlayStyle={{ backgroundColor: 'rgba(22, 22, 22, 0.18)' }}
                onEscapeKeyDown={(event) => {
                    handleQuickRecordEscapeKeyDown(event, document);
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    state.opener?.focus();
                }}
                onOpenAutoFocus={(event) => {
                    const root = event.currentTarget;

                    if (!(root instanceof HTMLElement)) {
                        return;
                    }

                    const closeButton = root.querySelector<HTMLButtonElement>('[data-drawer-close]');

                    if (closeButton) {
                        event.preventDefault();
                        closeButton.focus();
                    }
                }}
                style={{
                    background: 'var(--evo-surface)',
                    borderColor: 'var(--evo-hairline)',
                    boxShadow: 'none',
                    color: 'var(--evo-ink)',
                    transitionTimingFunction: 'var(--motion-ease-out, cubic-bezier(.2,.8,.2,1))',
                    transitionDuration: 'var(--motion-duration-drawer, 200ms)',
                }}
                className={cn(
                    'w-full max-sm:w-full sm:w-[min(92vw,520px)] lg:w-[480px]',
                    'gap-0 border-l bg-surface p-0',
                    PAGE_OVERFLOW_CLASS,
                    MOTION_DRAWER_CLASS,
                    'motion-reduce:transition-none',
                )}
            >
                <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            {history.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={back}
                                    className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--evo-ink-secondary)] hover:text-[var(--evo-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                >
                                    <ArrowLeft className="size-3.5" aria-hidden />
                                    {t('Back')}
                                </button>
                            ) : null}
                            <HeaderIdentity descriptor={status === 'ready' ? descriptor : null} />
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={openFull}
                                disabled={!descriptor?.fullRecordHref && !error?.fullRecordHref}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--evo-ink)] hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] disabled:text-[var(--evo-ink-muted)]"
                                aria-label={t('Open full record')}
                            >
                                {t('Open full')}
                                <ArrowSquareOut className="size-3.5" aria-hidden />
                            </button>
                            <button
                                type="button"
                                data-drawer-close
                                onClick={close}
                                className="inline-flex size-8 items-center justify-center rounded-md text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-canvas)] hover:text-[var(--evo-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                aria-label={t('Close')}
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>
                    </div>
                    {status === 'ready' && sections.length > 1 ? (
                        <nav className="mt-3 flex gap-1 overflow-x-auto" aria-label={accessibleName}>
                            {sections.map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setSection(id)}
                                    className={cn(
                                        'shrink-0 rounded-full px-2.5 py-1 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]',
                                        section === id
                                            ? 'bg-[var(--evo-ink)] text-white'
                                            : 'text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-canvas)]',
                                    )}
                                    aria-pressed={section === id}
                                >
                                    {t(SECTION_LABELS[id])}
                                </button>
                            ))}
                        </nav>
                    ) : null}
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--evo-surface)] px-4 py-4">
                    {status === 'loading' ? <DrawerSkeleton /> : null}

                    {status === 'error' && error ? (
                        <div className="space-y-3">
                            <p className="text-[14px] text-[var(--evo-ink)]">{error.message}</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={close}
                                    className="rounded-md border border-[var(--evo-hairline)] px-3 py-1.5 text-[12px] text-[var(--evo-ink)] hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                >
                                    {t('Close')}
                                </button>
                                {error.code !== 'malformed' && error.code !== 'forbidden' ? (
                                    <button
                                        type="button"
                                        onClick={retry}
                                        className="rounded-md border border-[var(--evo-hairline)] px-3 py-1.5 text-[12px] text-[var(--evo-ink)] hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                    >
                                        {t('Retry')}
                                    </button>
                                ) : null}
                                {error.fullRecordHref && error.code !== 'forbidden' ? (
                                    <button
                                        type="button"
                                        onClick={openFull}
                                        className="rounded-md bg-[var(--evo-ink)] px-3 py-1.5 text-[12px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                    >
                                        {t('Open full')}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {status === 'ready' && descriptor ? (
                        <div>
                            {section === 'overview' ? (
                                <div>
                                    {descriptor.attention?.signals &&
                                    descriptor.attention.signals.length > 0 ? (
                                        <section
                                            className="mb-4"
                                            data-crm="deal-attention"
                                            aria-labelledby="drawer-attention-heading"
                                        >
                                            <h3
                                                id="drawer-attention-heading"
                                                className="text-[12px] font-medium text-[var(--evo-ink)]"
                                            >
                                                {t('Needs attention')}
                                            </h3>
                                            <ul className="mt-2 space-y-2">
                                                {descriptor.attention.signals.map((signal) => (
                                                    <li
                                                        key={`${signal.type}-${signal.ref?.id ?? 'none'}`}
                                                        className={attentionToneClass(signal.severity)}
                                                    >
                                                        <p className="text-[13px] font-medium">
                                                            {signal.label}
                                                        </p>
                                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                                            {signal.reason}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ) : null}
                                    <dl>
                                        {descriptor.keyProperties.map((property) => (
                                            <PropertyRow key={property.id} property={property} />
                                        ))}
                                    </dl>
                                </div>
                            ) : null}
                            {section === 'activity' ? (
                                <ActivityList
                                    items={descriptor.activity}
                                    empty={t('No activity on this record')}
                                />
                            ) : null}
                            {section === 'notes' ? (
                                <div className="space-y-3">
                                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                        {t('Notes are read-only in the drawer. Add or edit on the full record.')}
                                    </p>
                                    <ActivityList items={descriptor.notes} empty={t('No notes')} />
                                </div>
                            ) : null}
                            {section === 'tasks' ? (
                                <div className="space-y-3">
                                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                        {t('Tasks are read-only in the drawer. Create or complete them on the full record.')}
                                    </p>
                                    <ActivityList items={descriptor.tasks} empty={t('No tasks')} />
                                </div>
                            ) : null}
                            {section === 'associations' ? (
                                <AssociationList items={descriptor.associations} onOpen={replace} />
                            ) : null}

                            {descriptor.capabilities.actions && descriptor.actions.length > 0 ? (
                                <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--evo-surface-subtle)] pt-4">
                                    {descriptor.actions
                                        .filter((action) => action.id !== 'open_full')
                                        .map((action) => (
                                            <a
                                                key={action.id}
                                                href={action.href}
                                                className="rounded-md border border-[var(--evo-hairline)] px-3 py-1.5 text-[12px] text-[var(--evo-ink)] hover:bg-[var(--evo-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
                                            >
                                                {t(action.label)}
                                            </a>
                                        ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
