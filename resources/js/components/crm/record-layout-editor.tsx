import { ChevronDown, ChevronUp, Columns3, RotateCcw } from 'lucide-react';
import { useRecordLayoutContext } from '@/components/crm/record-layout-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cardsForObject  } from '@/lib/record-layout';
import type {RecordColumn} from '@/lib/record-layout';

const COLUMN_LABELS: Record<RecordColumn, string> = {
    main: 'Main column',
    side: 'Side column',
};

export function RecordLayoutCustomizeButton() {
    const { setEditorOpen } = useRecordLayoutContext();

    return (
        <Button type="button" variant="secondary" className="h-7 text-[11px]" onClick={() => setEditorOpen(true)}>
            <Columns3 className="mr-1 size-3.5" />
            Customize layout
        </Button>
    );
}

export function RecordLayoutEditor() {
    const { objectType, layout, editorOpen, setEditorOpen, setCardVisible, moveCard, resetLayout, mode } =
        useRecordLayoutContext();
    const defs = cardsForObject(objectType);

    return (
        <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Customize record layout</SheetTitle>
                    <SheetDescription>
                        Show, hide, and reorder cards on {objectType} records.
                        {mode === 'workspace'
                            ? ' Save as workspace default when you are done.'
                            : ' Saved to your account.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-5 px-4 pb-6">
                    {(['main', 'side'] as RecordColumn[]).map((column) => (
                        <section key={column} className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {COLUMN_LABELS[column]}
                            </h3>
                            {defs
                                .filter((def) => def.column === column)
                                .sort((a, b) => {
                                    const leftOrder = layout.cards.find((card) => card.id === a.id)?.order ?? a.order;
                                    const rightOrder = layout.cards.find((card) => card.id === b.id)?.order ?? b.order;

                                    return leftOrder - rightOrder;
                                })
                                .map((def) => {
                                    const state = layout.cards.find((card) => card.id === def.id);

                                    return (
                                        <div
                                            key={def.id}
                                            className="flex items-center justify-between rounded border border-hairline px-2 py-1.5"
                                        >
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={state?.visible ?? def.defaultVisible}
                                                    onChange={(event) => setCardVisible(def.id, event.target.checked)}
                                                />
                                                {def.label}
                                            </label>
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    aria-label={`Move ${def.label} up`}
                                                    onClick={() => moveCard(def.id, 'up')}
                                                >
                                                    <ChevronUp className="size-4" aria-hidden />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    aria-label={`Move ${def.label} down`}
                                                    onClick={() => moveCard(def.id, 'down')}
                                                >
                                                    <ChevronDown className="size-4" aria-hidden />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </section>
                    ))}
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={resetLayout}>
                            <RotateCcw className="mr-1 size-3.5" />
                            Reset
                        </Button>
                        <Button type="button" onClick={() => setEditorOpen(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
