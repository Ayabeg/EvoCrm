import { Link, router } from '@inertiajs/react';
import { ChevronDown, Plus, Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ListView = {
    key: string;
    label: string;
    href: string;
};

export function CrmListHeader({
    title,
    views,
    activeView,
    onAddView,
    primaryLabel,
    onPrimary,
    headerActions,
}: {
    title: string;
    views: ListView[];
    activeView: string;
    onAddView?: () => void;
    primaryLabel: string;
    onPrimary: () => void;
    headerActions?: ReactNode;
}) {
    return (
        <div className="border-b border-hairline bg-canvas px-4 pt-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
                <button
                    type="button"
                    className="inline-flex items-center gap-1 text-page-title text-ink"
                >
                    {title}
                    <ChevronDown className="size-4 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2">
                    {headerActions}
                    <Button
                        onClick={onPrimary}
                        size="sm"
                        className="h-8 rounded-sm text-ui"
                    >
                        {primaryLabel}
                    </Button>
                </div>
            </div>
            <div className="mt-3 flex items-end gap-4">
                {views.map((view) => (
                    <Link
                        key={view.key}
                        href={view.href}
                        className={cn(
                            'border-b-2 pb-2 text-ui',
                            activeView === view.key
                                ? 'border-brand font-medium text-ink'
                                : 'border-transparent text-muted-foreground hover:text-ink',
                        )}
                    >
                        {view.label}
                    </Link>
                ))}
                {views.length > 0 ? (
                    <button
                        type="button"
                        onClick={onAddView}
                        className="mb-2 inline-flex items-center gap-1 text-ui text-muted-foreground hover:text-ink"
                    >
                        <Plus className="size-3.5" />
                        add view
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export function CrmListToolbar({
    action,
    query,
    sort,
    sortOptions,
    children,
}: {
    action: string;
    query?: string;
    sort?: string;
    sortOptions: { value: string; label: string }[];
    children?: ReactNode;
}) {
    return (
        <div className="space-y-2 border-b border-hairline bg-canvas px-4 py-3 sm:px-6">
            <FormBar action={action}>
                <input type="hidden" name="sort" value={sort ?? ''} />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            name="q"
                            defaultValue={query ?? ''}
                            placeholder="Search"
                            className="h-8 rounded-sm bg-canvas pl-7 text-ui"
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="outline"
                        className="h-8 rounded-sm text-ui"
                    >
                        Filter
                    </Button>
                    <label className="inline-flex h-8 items-center gap-1 rounded-sm border border-hairline px-2 text-ui text-muted-foreground">
                        Sort by
                        <select
                            name="sort"
                            defaultValue={sort ?? sortOptions[0]?.value}
                            className="bg-transparent text-ink outline-none"
                            onChange={(event) =>
                                event.currentTarget.form?.requestSubmit()
                            }
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {children}
                    <button
                        type="button"
                        className="inline-flex h-7 items-center gap-1 rounded-sm border border-hairline px-2 text-[12px] text-muted-foreground"
                    >
                        <SlidersHorizontal className="size-3" />
                        Advanced filters
                    </button>
                </div>
            </FormBar>
        </div>
    );
}

function FormBar({
    action,
    children,
}: {
    action: string;
    children: ReactNode;
}) {
    return (
        <form
            action={action}
            method="get"
            onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const params: Record<string, string> = {};
                data.forEach((value, key) => {
                    if (typeof value === 'string' && value !== '') {
                        params[key] = value;
                    }
                });
                router.get(action, params, { preserveState: true });
            }}
        >
            {children}
        </form>
    );
}

export function ColumnFilter({
    name,
    label,
    value,
    options,
}: {
    name: string;
    label: string;
    value?: string;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="inline-flex h-7 items-center gap-1 rounded-sm border border-hairline px-2 text-[12px] text-ink">
            {label}
            <ChevronDown className="size-3 text-muted-foreground" />
            <select
                name={name}
                defaultValue={value ?? ''}
                className="sr-only"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
                <option value="">{label}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function CrmListFooter({
    count,
    noun,
    total,
    exportHref,
}: {
    count: number;
    noun: string;
    total?: number;
    exportHref?: string;
}) {
    const label =
        typeof total === 'number' && total > count
            ? `Showing ${count.toLocaleString()} of ${total.toLocaleString()} ${noun}`
            : `${count.toLocaleString()} ${noun}`;

    return (
        <div className="flex items-center justify-between gap-3 border-t border-hairline bg-canvas px-4 py-2 text-[12px] text-mute sm:px-6">
            <span>{label}</span>
            {exportHref ? (
                <a href={exportHref} className="hover:text-ink">
                    Export
                </a>
            ) : null}
        </div>
    );
}

export function CrmEmptyState({
    title,
    line,
    actionLabel,
    onAction,
}: {
    title: string;
    line: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="grid flex-1 place-items-center bg-canvas px-4 py-10 sm:px-6">
            <div className="max-w-sm text-center">
                <p className="text-[13px] font-medium text-ink">{title}</p>
                <p className="mt-1 text-[12px] leading-5 text-mute">{line}</p>
                {actionLabel && onAction ? (
                    <Button type="button" size="sm" onClick={onAction} className="mt-3">
                        {actionLabel}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
