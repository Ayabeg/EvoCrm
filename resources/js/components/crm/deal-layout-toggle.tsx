import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function DealLayoutToggle({
    current,
    pipelineId,
}: {
    current: 'list' | 'board';
    pipelineId?: number;
}) {
    const query = pipelineId && pipelineId > 0 ? `?pipeline=${pipelineId}` : '';
    const listHref = `/crm/deals${query}`;
    const boardHref = `/crm/deals/board${query}`;

    return (
        <div
            className="inline-flex overflow-hidden rounded border border-hairline text-[11px]"
            data-testid="deal-layout-toggle"
        >
            <Link
                href={listHref}
                aria-current={current === 'list' ? 'page' : undefined}
                className={cn(
                    'px-2.5 py-1',
                    current === 'list'
                        ? 'bg-canvas-soft font-medium text-ink'
                        : 'bg-canvas text-mute hover:text-ink',
                )}
            >
                List
            </Link>
            <Link
                href={boardHref}
                aria-current={current === 'board' ? 'page' : undefined}
                className={cn(
                    'px-2.5 py-1',
                    current === 'board'
                        ? 'bg-canvas-soft font-medium text-ink'
                        : 'bg-canvas text-mute hover:text-ink',
                )}
            >
                Board
            </Link>
        </div>
    );
}
