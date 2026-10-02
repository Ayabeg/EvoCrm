/**
 * Evo Design System — QuickRecord (peek / sheet)
 * Registry: custom Evo on Sheet
 * License: MIT (original)
 * Keeps QuickRecord contracts; tokens only (no raw hex).
 */

import { useMemo, useState } from 'react';
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
import { ArrowLeft, ArrowSquareOut } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import type { BadgeTone } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/evo/ui/sheet';
import { Skeleton } from '@/evo/ui/skeleton';
import { Status } from '@/evo/ui/status';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/evo/ui/tabs';
import { handleQuickRecordEscapeKeyDown } from '@/lib/command-os';
import { t } from '@/lib/i18n';

function useQuickRecordSafe() {
    try {
        return useQuickRecord();
    } catch {
        return null;
    }
}

type SectionId = 'overview' | 'activity' | 'notes' | 'tasks' | 'associations';

const TONE: Record<RecordStatusTone, BadgeTone> = {
    neutral: 'neutral',
    success: 'success',
    warning: 'warn',
    danger: 'error',
};

function visibleSections(
    capabilities: RecordCapabilities | undefined,
): SectionId[] {
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

function PropertyRow({ property }: { property: KeyProperty }) {
    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-1.5">
            <dt className="text-[12px] text-[var(--evo-ink-muted)]">
                {t(property.label)}
            </dt>
            <dd
                className="min-w-0 truncate text-[13px] text-[var(--evo-ink)]"
                title={property.value ?? undefined}
            >
                {property.href && property.value ? (
                    <a
                        href={property.href}
                        className="text-[var(--evo-teal)] hover:underline"
                    >
                        {property.value}
                    </a>
                ) : (
                    (property.value ?? EMPTY_VALUE)
                )}
            </dd>
        </div>
    );
}

function ActivityList({
    items,
    empty,
}: {
    items: RecordActivityItem[];
    empty: string;
}) {
    if (items.length === 0) {
        return (
            <p className="text-[13px] text-[var(--evo-ink-muted)]">
                {t(empty)}
            </p>
        );
    }

    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li
                    key={item.id}
                    className="min-w-0 border-b border-[var(--evo-hairline)] pb-3 last:border-0 last:pb-0"
                >
                    <p className="truncate text-[13px] font-medium text-[var(--evo-ink)]">
                        {item.title}
                    </p>
                    {item.body ? (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--evo-ink-secondary)]">
                            {item.body}
                        </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--evo-ink-muted)]">
                        {[item.type, item.owner].filter(Boolean).join(' · ')}
                    </p>
                </li>
            ))}
        </ul>
    );
}

export function QuickRecord({
    open: openOverride,
    onOpenChange,
    preview,
}: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    preview?: RecordDescriptor | null;
} = {}) {
    const api = useQuickRecordSafe();
    const state = api?.state;
    const close = api?.close ?? (() => onOpenChange?.(false));
    const back = api?.back;
    const retry = api?.retry;
    const openFull = api?.openFull;
    const openRecord = api?.openRecord;
    const record = preview ?? state?.descriptor ?? null;
    const sections = useMemo(
        () => visibleSections(record?.capabilities),
        [record?.capabilities],
    );
    const [section, setSection] = useState<SectionId>('overview');
    const status = preview ? 'ready' : (state?.status ?? 'idle');
    const open = openOverride ?? (preview ? true : Boolean(state?.open));
    const canBack = Boolean(state && state.history.length > 0);

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                onOpenChange?.(next);

                if (!next) {
                    close();
                }
            }}
        >
            <SheetContent
                side="right"
                className={cn('w-full sm:max-w-[min(92vw,32rem)]')}
                data-ds="quick-record-drawer"
                data-evo="quick-record"
                onEscapeKeyDown={(event) => {
                    handleQuickRecordEscapeKeyDown(event, document);
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    state?.opener?.focus();
                }}
            >
                <SheetHeader className="border-b border-[var(--evo-hairline)] pr-10">
                    <div className="flex items-center gap-2">
                        {canBack && back ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t('Back')}
                                onClick={back}
                            >
                                <ArrowLeft className="size-4" aria-hidden />
                            </Button>
                        ) : null}
                        <SheetTitle className="truncate text-[16px]">
                            {record?.title ?? t('Record')}
                        </SheetTitle>
                    </div>
                    <SheetDescription className="sr-only">
                        {t('Quick record peek')}
                    </SheetDescription>
                    {record?.status ? (
                        <Status
                            tone={TONE[record.status.tone ?? 'neutral']}
                            label={record.status.label}
                        />
                    ) : null}
                    {record?.subtitle ? (
                        <p className="truncate text-[13px] text-[var(--evo-ink-secondary)]">
                            {record.subtitle}
                        </p>
                    ) : null}
                </SheetHeader>

                {status === 'loading' ? (
                    <div className="space-y-3 p-4" aria-busy>
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : null}

                {status === 'error' ? (
                    <div className="space-y-3 p-4">
                        <p className="text-[13px] text-[var(--evo-ink)]">
                            {state?.error?.message ??
                                t('Could not load this record.')}
                        </p>
                        <div className="flex gap-2">
                            {retry ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={retry}
                                >
                                    {t('Retry')}
                                </Button>
                            ) : null}
                            {state?.error?.fullRecordHref ? (
                                <Button asChild variant="ghost" size="sm">
                                    <a href={state.error.fullRecordHref}>
                                        {t('Open full record')}
                                    </a>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {status === 'ready' && record ? (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <Tabs
                            value={
                                sections.includes(section)
                                    ? section
                                    : sections[0]
                            }
                            onValueChange={(value) =>
                                setSection(value as SectionId)
                            }
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <TabsList className="mx-4 mt-3 w-[calc(100%-2rem)] justify-start overflow-x-auto">
                                {sections.map((id) => (
                                    <TabsTrigger key={id} value={id}>
                                        {t(
                                            id === 'overview'
                                                ? 'Overview'
                                                : id === 'activity'
                                                  ? 'Activity'
                                                  : id === 'notes'
                                                    ? 'Notes'
                                                    : id === 'tasks'
                                                      ? 'Tasks'
                                                      : 'Associations',
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <TabsContent
                                value="overview"
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                            >
                                <dl>
                                    {record.keyProperties.map((property) => (
                                        <PropertyRow
                                            key={property.id}
                                            property={property}
                                        />
                                    ))}
                                </dl>
                            </TabsContent>
                            <TabsContent
                                value="activity"
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                            >
                                <ActivityList
                                    items={record.activity}
                                    empty="No activity yet"
                                />
                            </TabsContent>
                            <TabsContent
                                value="notes"
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                            >
                                <ActivityList
                                    items={record.notes}
                                    empty="No notes yet"
                                />
                            </TabsContent>
                            <TabsContent
                                value="tasks"
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                            >
                                <ActivityList
                                    items={record.tasks}
                                    empty="No tasks yet"
                                />
                            </TabsContent>
                            <TabsContent
                                value="associations"
                                className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
                            >
                                {record.associations.length === 0 ? (
                                    <p className="text-[13px] text-[var(--evo-ink-muted)]">
                                        {t('No associations')}
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {record.associations.map(
                                            (item: RecordAssociation) => (
                                                <li
                                                    key={`${item.ref.type}-${item.ref.id}`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="block w-full truncate rounded-[var(--evo-radius-compact)] px-1 py-1 text-left text-[13px] hover:bg-[var(--evo-hover)]"
                                                        onClick={() =>
                                                            openRecord?.(
                                                                item.ref,
                                                            )
                                                        }
                                                    >
                                                        {item.label}
                                                    </button>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                            </TabsContent>
                        </Tabs>
                        <div className="flex items-center justify-between gap-2 border-t border-[var(--evo-hairline)] px-4 py-3">
                            {openFull ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={openFull}
                                >
                                    <ArrowSquareOut
                                        className="size-3.5"
                                        aria-hidden
                                    />
                                    {t('Open full record')}
                                </Button>
                            ) : record.fullRecordHref ? (
                                <Button asChild variant="outline" size="sm">
                                    <a href={record.fullRecordHref}>
                                        <ArrowSquareOut
                                            className="size-3.5"
                                            aria-hidden
                                        />
                                        {t('Open full record')}
                                    </a>
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
