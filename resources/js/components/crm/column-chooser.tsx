import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { ListColumnDef, ListViewColumn } from '@/lib/list-view-config';

export default function ColumnChooser({
    columnDefs,
    columns,
    onChange,
}: {
    columnDefs: ListColumnDef[];
    columns: ListViewColumn[];
    onChange?: (columns: ListViewColumn[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(columns);

    const ordered = useMemo(
        () =>
            [...draft].sort((a, b) => a.order - b.order).map((column) => ({
                ...column,
                label: columnDefs.find((def) => def.id === column.id)?.label ?? column.id,
            })),
        [draft, columnDefs],
    );

    const toggle = (id: string, visible: boolean) => {
        setDraft((current) =>
            current.map((column) => (column.id === id ? { ...column, visible } : column)),
        );
    };

    const move = (id: string, direction: -1 | 1) => {
        const sorted = [...ordered];
        const index = sorted.findIndex((column) => column.id === id);
        const target = index + direction;

        if (index < 0 || target < 0 || target >= sorted.length) {
            return;
        }

        const next = [...sorted];
        [next[index], next[target]] = [next[target], next[index]];
        setDraft(next.map((column, order) => ({ id: column.id, visible: column.visible, order })));
    };

    const apply = () => {
        onChange?.(draft);
        setOpen(false);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setDraft(columns);
                }
            }}
        >
            <SheetTrigger asChild>
                <Button type="button" variant="secondary" className="h-7 px-2 text-[11px]">
                    Columns
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
                <SheetHeader>
                    <SheetTitle className="text-sm">Choose columns</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                    {ordered.map((column) => (
                        <div key={column.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5">
                            <label className="flex items-center gap-2 text-[12px]">
                                <Checkbox
                                    checked={column.visible}
                                    onCheckedChange={(checked) => toggle(column.id, checked === true)}
                                />
                                {column.label}
                            </label>
                            <div className="flex gap-1">
                                <button type="button" className="text-[11px] text-mute" onClick={() => move(column.id, -1)}>
                                    ↑
                                </button>
                                <button type="button" className="text-[11px] text-mute" onClick={() => move(column.id, 1)}>
                                    ↓
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <Button type="button" className="h-8 text-[12px]" onClick={apply}>
                        Apply
                    </Button>
                </div>
                <input type="hidden" name="columns" value={JSON.stringify(draft)} />
            </SheetContent>
        </Sheet>
    );
}

export function ColumnChooserHiddenInput({ columns }: { columns: ListViewColumn[] }) {
    return <input type="hidden" name="columns" value={JSON.stringify(columns)} />;
}
