import { Link } from '@inertiajs/react';

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
                className={`px-2.5 py-1 ${
                    current === 'list'
                        ? 'bg-ink text-canvas'
                        : 'bg-canvas text-ink hover:bg-canvas-soft'
                }`}
            >
                List
            </Link>
            <Link
                href={boardHref}
                className={`px-2.5 py-1 ${
                    current === 'board'
                        ? 'bg-brand text-canvas'
                        : 'bg-canvas text-ink hover:bg-canvas-soft'
                }`}
            >
                Board
            </Link>
        </div>
    );
}
