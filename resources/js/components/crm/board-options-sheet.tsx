import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/evo/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/evo/ui/drawer';
import { cn } from '@/lib/utils';

export type BoardOptions = {
    card_style: 'default' | 'compact';
    show_priority: boolean;
    show_associations: boolean;
    show_activity: boolean;
    mark_inactive: boolean;
    inactive_after_days: number;
    sort: 'last_activity' | 'amount' | 'close_date' | 'title';
};

export function BoardOptionsSheet({
    open,
    onOpenChange,
    options,
    exportHref,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: BoardOptions;
    exportHref: string;
}) {
    const [tab, setTab] = useState<'cards' | 'board'>('cards');

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                side="right"
                className="bg-canvas text-ink"
                style={{ background: 'var(--evosales-canvas)', color: 'var(--evosales-ink)' }}
            >
                <DrawerHeader className="border-b border-hairline px-5 py-4">
                    <DrawerTitle className="text-[15px] text-ink">Edit board view</DrawerTitle>
                    <div className="mt-3 flex gap-4 text-[13px]">
                        <button
                            type="button"
                            className={cn(
                                'border-b-2 pb-1',
                                tab === 'cards'
                                    ? 'border-brand font-medium text-ink'
                                    : 'border-transparent text-mute',
                            )}
                            onClick={() => setTab('cards')}
                        >
                            Cards
                        </button>
                        <button
                            type="button"
                            className={cn(
                                'border-b-2 pb-1',
                                tab === 'board'
                                    ? 'border-brand font-medium text-ink'
                                    : 'border-transparent text-mute',
                            )}
                            onClick={() => setTab('board')}
                        >
                            Board
                        </button>
                    </div>
                </DrawerHeader>

                {tab === 'cards' ? (
                    <Form
                        action="/crm/deals/board/options"
                        method="put"
                        className="flex min-h-0 flex-1 flex-col"
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <>
                                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 text-[13px]">
                                    <fieldset>
                                        <legend className="mb-2 font-medium text-ink">
                                            Choose card style
                                        </legend>
                                        <div className="flex gap-3">
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="card_style"
                                                    value="default"
                                                    defaultChecked={options.card_style === 'default'}
                                                />
                                                Default
                                            </label>
                                            <label className="flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="card_style"
                                                    value="compact"
                                                    defaultChecked={options.card_style === 'compact'}
                                                />
                                                Compact
                                            </label>
                                        </div>
                                    </fieldset>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="show_priority"
                                            value="1"
                                            defaultChecked={options.show_priority}
                                        />
                                        Display priority and associated records
                                    </label>
                                    <input type="hidden" name="show_associations" value="1" />

                                    <label className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            name="show_activity"
                                            value="1"
                                            defaultChecked={options.show_activity}
                                            className="mt-0.5"
                                        />
                                        <span>
                                            <span className="font-medium">Deal activity information</span>
                                            <span className="mt-0.5 block text-[12px] text-mute">
                                                Show next and last activity information for each deal
                                            </span>
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            name="mark_inactive"
                                            value="1"
                                            defaultChecked={options.mark_inactive}
                                            className="mt-0.5"
                                        />
                                        <span>
                                            <span className="font-medium">Inactive cards</span>
                                            <span className="mt-0.5 block text-[12px] text-mute">
                                                Mark cards that have gone a designated amount of time with no recorded activity
                                            </span>
                                        </span>
                                    </label>

                                    <label className="grid max-w-[12rem] gap-1 text-[12px] text-mute">
                                        Mark cards inactive after
                                        <span className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                name="inactive_after_days"
                                                min={1}
                                                max={90}
                                                defaultValue={options.inactive_after_days}
                                                className="h-8 w-16 rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                            />
                                            days
                                        </span>
                                    </label>

                                    <label className="grid max-w-[16rem] gap-1 text-[12px] text-mute">
                                        Sort
                                        <select
                                            name="sort"
                                            defaultValue={options.sort}
                                            className="h-8 rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                        >
                                            <option value="last_activity">Last activity</option>
                                            <option value="amount">Amount</option>
                                            <option value="close_date">Close date</option>
                                            <option value="title">Deal name</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={processing}>
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                ) : (
                    <div className="space-y-3 px-5 py-4 text-[13px]">
                        <p className="text-mute">
                            Columns, stage names, and win probabilities live in pipeline settings.
                        </p>
                        <Link
                            href="/settings/pipelines"
                            className="inline-block font-medium text-brand hover:underline"
                        >
                            Edit stages
                        </Link>
                        <div>
                            <a href={exportHref} className="font-medium text-brand hover:underline">
                                Export view
                            </a>
                        </div>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
