import { Link } from '@inertiajs/react';
import {
    crmListHref,
    filterFields,
    listFilterChips,
} from '@/components/crm/list-query';

export function CrmActiveFilters({
    basePath,
    activeFilters,
    members = [],
}: {
    basePath: string;
    activeFilters: Record<string, unknown>;
    members?: { id: number; name: string }[];
}) {
    const fields = filterFields(activeFilters);
    const chips = listFilterChips(activeFilters, members);

    if (chips.length === 0) {
        return null;
    }

    return (
        <div
            className="flex flex-wrap items-center gap-1.5 px-4 pb-2 sm:px-6"
            data-crm="active-filters"
        >
            {chips.map((chip) => (
                <Link
                    key={chip.key}
                    href={crmListHref(basePath, fields, { [chip.key]: null })}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-hairline bg-canvas-soft px-2 py-0.5 text-[11px] text-ink"
                    title={`Clear ${chip.label}`}
                >
                    <span className="text-mute">{chip.label}:</span>
                    <span className="truncate capitalize">{chip.value}</span>
                    <span aria-hidden className="text-mute">
                        ×
                    </span>
                </Link>
            ))}
            <Link
                href={crmListHref(basePath, { view: fields.view ?? 'all' })}
                className="text-[11px] text-mute hover:text-ink"
            >
                Clear all
            </Link>
        </div>
    );
}
