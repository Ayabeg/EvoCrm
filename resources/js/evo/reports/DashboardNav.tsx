import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';

import type { DashboardSummary } from './types';

export function DashboardNav({
    dashboards,
    activeId,
    onRooms,
    onOpen,
    onNew,
}: {
    dashboards: DashboardSummary[];
    activeId?: number;
    onRooms: () => void;
    onOpen: (id: number) => void;
    onNew: () => void;
}) {
    return (
        <nav aria-label={t('Dashboards')} className="mb-4 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={activeId ? 'outline' : 'secondary'} onClick={onRooms}>
                {t('Rooms')}
            </Button>
            {dashboards.map((board) => (
                <Button
                    key={board.id}
                    type="button"
                    size="sm"
                    variant={activeId === board.id ? 'secondary' : 'outline'}
                    onClick={() => onOpen(board.id)}
                >
                    {board.visibility === 'workspace' ? '◆ ' : board.visibility === 'team' ? '◇ ' : ''}
                    {board.name}
                </Button>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={onNew}>
                {t('New dashboard')}
            </Button>
        </nav>
    );
}
