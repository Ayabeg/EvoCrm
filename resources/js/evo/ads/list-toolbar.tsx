import type { ReactNode } from 'react';

import type { AdsListViewId } from '@/evo/ads/types';
import { FilterBar } from '@/evo/data/filters';
import { SavedViews } from '@/evo/data/saved-views';
import { t } from '@/lib/i18n';

export const ADS_LIST_VIEWS: Array<{ id: AdsListViewId; name: string }> = [
    { id: 'all', name: 'All campaigns' },
    { id: 'active', name: 'Active campaigns' },
    { id: 'paused', name: 'Paused campaigns' },
];

export function AdsListToolbar({
    search,
    onSearchChange,
    view,
    onViewChange,
    extra,
    views = ADS_LIST_VIEWS,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    view: AdsListViewId;
    onViewChange: (view: AdsListViewId) => void;
    extra?: ReactNode;
    views?: Array<{ id: AdsListViewId; name: string }>;
}) {
    return (
        <div className="flex flex-col gap-2">
            <SavedViews
                views={views.map((item) => ({ id: item.id, name: t(item.name) }))}
                activeViewId={view}
                onViewChange={(id) => onViewChange(String(id) as AdsListViewId)}
                canSave={false}
            />
            <FilterBar search={search} onSearchChange={onSearchChange} extra={extra} />
        </div>
    );
}
