import { Form, Link } from '@inertiajs/react';
import { formatDzd } from '@/lib/money';

export type LostReviewRow = {
    id: number;
    deal_id: number;
    title: string;
    amount_cents: number;
    body?: string | null;
    status: string;
    lost_reason?: string | null;
};

export default function LostReviewList({
    items = [],
}: {
    items?: LostReviewRow[];
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section
            data-testid="lost-review"
            className="border-t border-hairline bg-canvas py-3"
        >
            <header className="mb-3">
                <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                    Lost this week
                </h2>
                <p className="mt-1 text-[12px] text-mute">
                    Ask Evo drafted a reason. Confirm it — nothing is written
                    until you do.
                </p>
            </header>
            <ul className="space-y-3">
                {items.map((row) => (
                    <li
                        key={row.id}
                        className="border-t border-hairline pt-3 first:border-0 first:pt-0"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <Link
                                href={`/crm/deals/${row.deal_id}`}
                                className="text-[13px] font-medium text-ink hover:underline"
                            >
                                {row.title}
                            </Link>
                            <span className="money text-[12px] text-mute">
                                {formatDzd(row.amount_cents)}
                            </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-5 text-ink">
                            {row.body}
                        </p>
                        <Form
                            action={`/crm/lost-reviews/${row.id}/confirm`}
                            method="post"
                            className="mt-2"
                        >
                            <button
                                type="submit"
                                className="h-7 rounded-md border border-hairline bg-canvas px-3 text-[11px] text-ink hover:border-brand"
                            >
                                Confirm reason
                            </button>
                        </Form>
                    </li>
                ))}
            </ul>
        </section>
    );
}
