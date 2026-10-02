/**
 * Evo SavedViews — custom (not a ReUI block).
 */

import * as React from 'react';

import { BookmarkSimple, FloppyDisk } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { filtersFr } from '@/evo/vendor/reui/filters/i18n';
import type { SavedView } from '@/lib/list-view-config';

export type SavedViewsProps = {
    views: Array<Pick<SavedView, 'id' | 'name'> | { id: string | number; name: string }>;
    activeViewId?: string | number | null;
    onViewChange?: (id: string | number) => void;
    onSave?: () => void;
    canSave?: boolean;
    className?: string;
};

function SavedViews({
    views,
    activeViewId,
    onViewChange,
    onSave,
    canSave = true,
    className,
}: SavedViewsProps) {
    return (
        <div className={cn('flex flex-wrap items-center gap-1', className)} data-slot="saved-views">
            {views.map((view) => {
                const active = String(view.id) === String(activeViewId);

                return (
                    <Button
                        key={String(view.id)}
                        variant={active ? 'secondary' : 'ghost'}
                        size="sm"
                        aria-pressed={active}
                        onClick={() => onViewChange?.(view.id)}
                    >
                        <BookmarkSimple className="size-3.5" aria-hidden />
                        {view.name}
                    </Button>
                );
            })}
            {canSave && onSave ? (
                <Button variant="outline" size="sm" onClick={onSave}>
                    <FloppyDisk className="size-3.5" aria-hidden />
                    {filtersFr.saveView}
                </Button>
            ) : null}
        </div>
    );
}

export { SavedViews };
