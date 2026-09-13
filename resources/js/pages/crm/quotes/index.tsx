import { Link } from '@inertiajs/react';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import { CrmShell } from '@/components/crm/crm-shell';
import { CrmEmptyState } from '@/components/crm/list-chrome';

type QuoteRow = {
    id: number;
    status: string;
    total_cents: number | null;
    deal?: { id: number; title: string } | null;
};

export default function QuotesIndex({ quotes }: { quotes: QuoteRow[] }) {
    return (
        <CrmShell title="Quotes" chrome="workspace">
            <CrmObjectHeader title="Quotes" />
            {quotes.length === 0 ? (
                <CrmEmptyState
                    title="No quotes yet"
                    line="Create a quote from a deal. Qualifying a lead still creates one deal."
                />
            ) : (
                <ul className="divide-y divide-hairline border-t border-hairline bg-canvas">
                    {quotes.map((quote) => (
                        <li key={quote.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                            <div className="min-w-0">
                                <p className="truncate font-medium text-ink">
                                    {quote.deal?.title ?? `Quote #${quote.id}`}
                                </p>
                                <p className="text-[12px] text-mute">{quote.status}</p>
                            </div>
                            {quote.deal ? (
                                <Link
                                    href={`/crm/deals/${quote.deal.id}`}
                                    className="shrink-0 font-medium text-ink hover:underline"
                                >
                                    Open deal
                                </Link>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </CrmShell>
    );
}

QuotesIndex.layout = {
    breadcrumbs: [{ title: 'Quotes', href: '/crm/quotes' }],
};
