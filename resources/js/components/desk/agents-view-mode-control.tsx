import { List, SquaresFour, Table } from '@phosphor-icons/react';
import type { SegmentedControlLayout } from '@/components/ui/segmented-control';
import {
    SegmentedControl,
    SegmentedControlItem,
} from '@/components/ui/segmented-control';
import { useAgentsViewMode } from '@/lib/desk/use-agents-view-mode';
import { cn } from '@/lib/utils';

function GridIcon() {
    return <SquaresFour className="size-4" weight="regular" aria-hidden />;
}

function ListIcon() {
    return <List className="size-4" weight="regular" aria-hidden />;
}

function TableIcon() {
    return <Table className="size-4" weight="regular" aria-hidden />;
}

export function AgentsViewModeControl({
    className,
    layout = 'fill',
}: {
    className?: string;
    layout?: SegmentedControlLayout;
}) {
    const [value, setValue] = useAgentsViewMode();

    return (
        <SegmentedControl
            className={cn('min-w-0', className)}
            label="View mode"
            layout={layout}
            onChange={setValue}
            size="sm"
            value={value}
        >
            <SegmentedControlItem
                icon={<GridIcon />}
                label="Grid"
                value="grid"
            />
            <SegmentedControlItem
                icon={<ListIcon />}
                label="List"
                value="list"
            />
            <SegmentedControlItem
                icon={<TableIcon />}
                label="Table"
                value="table"
            />
        </SegmentedControl>
    );
}
