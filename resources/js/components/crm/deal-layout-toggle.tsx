import { ListBullets, SquaresFour } from '@phosphor-icons/react';
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
                    'inline-flex items-center gap-1 px-2.5 py-1',
                    current === 'list'
                        ? 'bg-white font-medium text-ink'
                        : 'bg-canvas-soft text-mute hover:text-ink',
                )}
            >
                <ListBullets className="size-3.5" weight="bold" aria-hidden />
                List
            </Link>
            <Link
                href={boardHref}
                aria-current={current === 'board' ? 'page' : undefined}
                className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1',
                    current === 'board'
                        ? 'bg-white font-medium text-ink'
                        : 'bg-canvas-soft text-mute hover:text-ink',
                )}
            >
                <SquaresFour className="size-3.5" weight="bold" aria-hidden />
                Board
            </Link>
        </div>
    );
}
