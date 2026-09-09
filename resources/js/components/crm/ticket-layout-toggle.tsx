import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export default function TicketLayoutToggle({
    current,
}: {
    current: 'list' | 'board';
}) {
    return (
        <div
            className="inline-flex overflow-hidden rounded border border-hairline text-[11px]"
            data-testid="ticket-layout-toggle"
        >
            <Link
                href="/crm/tickets"
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
                href="/crm/tickets/board"
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
