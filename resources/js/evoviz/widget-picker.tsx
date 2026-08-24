import { EVOVIZ_IDS } from '@/evoviz/contract';
import type { EvoVizId } from '@/evoviz/contract';

/**
 * Add-widget picker — lists the existing EvoViz charts already drawn
 * by the Reports rooms. No new chart types, no second library.
 */

export type ReportWidgetCatalogItem = {
    key: string;
    room: string;
    roomTitle: string;
    id: EvoVizId;
    title: string;
};

function chartKind(id: string): string {
    return id.startsWith('evoviz.') ? id.slice('evoviz.'.length) : id;
}

function isEvoVizId(id: string): id is EvoVizId {
    return (EVOVIZ_IDS as readonly string[]).includes(id);
}

export function WidgetPicker({
    catalog,
    addedKeys,
    onAdd,
}: {
    catalog: ReportWidgetCatalogItem[];
    addedKeys: string[];
    onAdd: (key: string) => void;
}) {
    const rooms = catalog.reduce<
        { room: string; title: string; items: ReportWidgetCatalogItem[] }[]
    >((acc, item) => {
        if (!isEvoVizId(item.id)) {
            return acc;
        }

        const existing = acc.find((group) => group.room === item.room);

        if (existing) {
            existing.items.push(item);
        } else {
            acc.push({
                room: item.room,
                title: item.roomTitle,
                items: [item],
            });
        }

        return acc;
    }, []);

    return (
        <div className="grid gap-4" aria-label="Add widget">
            {rooms.map((group) => (
                <section key={group.room} aria-label={group.title}>
                    <h3 className="mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">
                        {group.title}
                    </h3>
                    <ul className="grid gap-2">
                        {group.items.map((item) => {
                            const added = addedKeys.includes(item.key);

                            return (
                                <li
                                    key={item.key}
                                    className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-canvas px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] text-ink">
                                            {item.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {chartKind(item.id)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={added}
                                        onClick={() => onAdd(item.key)}
                                        className="h-8 shrink-0 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-default disabled:bg-hairline disabled:text-muted-foreground disabled:opacity-100"
                                    >
                                        {added ? 'Added' : 'Add'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}
