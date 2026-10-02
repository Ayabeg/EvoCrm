import { t } from '@/lib/i18n';

export type AnnouncementTarget = {
    id: string | number;
    name: string;
    column?: string;
};

export function frenchPipelineAnnouncements(
    items: AnnouncementTarget[],
    columns: AnnouncementTarget[],
) {
    const nameOf = (id: string | number) => {
        const item = items.find((row) => String(row.id) === String(id));
        const column = columns.find((row) => String(row.id) === String(id));

        return item?.name ?? column?.name ?? String(id);
    };

    const columnOf = (id: string | number) => {
        const item = items.find((row) => String(row.id) === String(id));
        const column = columns.find((row) => String(row.id) === String(id));

        return item?.column ?? column?.name ?? nameOf(id);
    };

    return {
        onDragStart({ active }: { active: { id: string | number } }) {
            return t('Picked up :name', { name: nameOf(active.id) });
        },
        onDragOver({
            active,
            over,
        }: {
            active: { id: string | number };
            over: { id: string | number } | null;
        }) {
            if (!over) {
                return;
            }

            return t(':name is over :column', {
                name: nameOf(active.id),
                column: columnOf(over.id),
            });
        },
        onDragEnd({
            active,
            over,
        }: {
            active: { id: string | number };
            over: { id: string | number } | null;
        }) {
            if (!over) {
                return t('Move cancelled for :name', {
                    name: nameOf(active.id),
                });
            }

            return t(':name dropped in :column', {
                name: nameOf(active.id),
                column: columnOf(over.id),
            });
        },
        onDragCancel({ active }: { active: { id: string | number } }) {
            return t('Move cancelled for :name', { name: nameOf(active.id) });
        },
    };
}
