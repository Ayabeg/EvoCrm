/**
 * Evo Design System — RecordProperties / PropertyGroup / InlineProperty
 * Registry: custom Evo
 * License: MIT (original)
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { RecordProperty } from '@/evo/crm/record/types';
import { cn } from '@/evo/lib/cn';
import { Input } from '@/evo/ui/input';
import { t } from '@/lib/i18n';

export function PropertyGroup({
    title,
    action,
    children,
    className,
}: {
    title?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn('space-y-2', className)}
            data-evo="property-group"
        >
            {title ? (
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold tracking-wide text-[var(--evo-ink-muted)] uppercase">
                        {t(title)}
                    </h3>
                    {action}
                </div>
            ) : null}
            <div className="space-y-2">{children}</div>
        </section>
    );
}

export function InlineProperty({
    property,
    onCommit,
    disabled = false,
}: {
    property: RecordProperty;
    onCommit?: (id: string, value: string) => void;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(property.value ?? '');
    const display = property.value?.trim() ? property.value : t('—');

    if (editing && onCommit && !disabled) {
        return (
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 py-1">
                <dt className="text-[12px] text-[var(--evo-ink-muted)]">
                    {t(property.label)}
                </dt>
                <dd>
                    <Input
                        autoFocus
                        value={draft}
                        aria-label={t(property.label)}
                        className="h-8"
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={() => {
                            onCommit(property.id, draft);
                            setEditing(false);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                onCommit(property.id, draft);
                                setEditing(false);
                            }

                            if (event.key === 'Escape') {
                                setDraft(property.value ?? '');
                                setEditing(false);
                            }
                        }}
                    />
                </dd>
            </div>
        );
    }

    const valueNode = property.href ? (
        <a
            href={property.href}
            className="truncate text-[var(--evo-teal)] hover:underline"
        >
            {display}
        </a>
    ) : (
        <span
            className={cn(
                'truncate',
                property.money && 'font-medium tabular-nums',
            )}
        >
            {display}
        </span>
    );

    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-1.5">
            <dt className="text-[12px] text-[var(--evo-ink-muted)]">
                {t(property.label)}
            </dt>
            <dd className="min-w-0 text-[13px] text-[var(--evo-ink)]">
                {onCommit && !disabled ? (
                    <button
                        type="button"
                        className="block w-full truncate rounded-[var(--evo-radius-compact)] text-start hover:bg-[var(--evo-hover)] focus-visible:ring-2 focus-visible:ring-[var(--evo-focus)] focus-visible:outline-none"
                        onClick={() => {
                            setDraft(property.value ?? '');
                            setEditing(true);
                        }}
                    >
                        {valueNode}
                    </button>
                ) : (
                    valueNode
                )}
            </dd>
        </div>
    );
}

export function RecordProperties({
    properties,
    title = 'Properties',
    onCommit,
    disabled = false,
    children,
}: {
    properties?: RecordProperty[];
    title?: string;
    onCommit?: (id: string, value: string) => void;
    disabled?: boolean;
    children?: ReactNode;
}) {
    return (
        <PropertyGroup title={title}>
            {properties?.length ? (
                <dl>
                    {properties.map((property) => (
                        <InlineProperty
                            key={property.id}
                            property={property}
                            onCommit={onCommit}
                            disabled={disabled}
                        />
                    ))}
                </dl>
            ) : null}
            {children}
        </PropertyGroup>
    );
}
