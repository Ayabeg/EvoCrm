import { CheckCircle, FileText } from '@phosphor-icons/react';
import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatDzd } from '@/lib/money';

type QuoteItem = {
    name: string;
    quantity: number;
    unit_cents: number;
    total_cents: number;
};

export default function PublicQuote({
    quote,
}: {
    quote: {
        id: number;
        status: string;
        currency: string;
        total_cents: number;
        notes?: string | null;
        expires_at?: string | null;
        accepted_at?: string | null;
        html?: string | null;
        workspace?: string | null;
        accept_url?: string;
        deal?: { title: string } | null;
        contact?: { first_name: string } | null;
        items?: QuoteItem[];
    };
}) {
    const items = quote.items ?? [];
    const accepted = Boolean(quote.accepted_at);
    const title = quote.deal?.title ?? `Quote #${quote.id}`;
    const greet = quote.contact?.first_name
        ? `${quote.contact.first_name}, review this quote.`
        : 'Review this quote.';

    return (
        <>
            <Head title={title} />
            <div
                className="flex min-h-[100dvh] flex-col bg-canvas text-ink"
                data-crm="public-quote"
            >
                <header className="border-b border-hairline px-5 py-4 sm:px-8">
                    <p className="text-[12px] font-medium tracking-tight text-ink">
                        EvoCrm
                    </p>
                    <p className="mt-0.5 text-[12px] text-mute">
                        {quote.workspace ?? 'Quote'}
                    </p>
                </header>
                <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8">
                    <div className="mb-6 flex items-start gap-3">
                        <span
                            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center bg-ink text-white"
                            aria-hidden
                        >
                            <FileText className="size-4" weight="bold" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[12px] text-mute">Quote #{quote.id}</p>
                            <h1 className="text-[22px] leading-tight font-semibold tracking-tight text-ink">
                                {title}
                            </h1>
                            <p className="mt-1 text-[13px] text-mute">{greet}</p>
                            <p className="mt-1 text-[12px] text-mute">
                                {accepted ? 'Accepted' : quote.status}
                                {quote.expires_at
                                    ? ` · Expires ${quote.expires_at}`
                                    : ''}
                            </p>
                        </div>
                    </div>

                    {items.length > 0 ? (
                        <table className="w-full border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-hairline text-left text-[11px] text-mute">
                                    <th className="py-2 font-medium">Item</th>
                                    <th className="py-2 font-medium">Qty</th>
                                    <th className="py-2 text-right font-medium">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr
                                        key={`${item.name}-${index}`}
                                        className="border-b border-hairline"
                                    >
                                        <td className="py-2 text-ink">{item.name}</td>
                                        <td className="money py-2 text-mute">
                                            {item.quantity}
                                        </td>
                                        <td className="money py-2 text-right text-ink">
                                            {formatDzd(item.total_cents)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : quote.html ? (
                        <div
                            className="border border-hairline bg-canvas px-4 py-3 text-[13px]"
                            dangerouslySetInnerHTML={{ __html: quote.html }}
                        />
                    ) : (
                        <p className="text-[13px] text-mute">No line items on this quote.</p>
                    )}

                    {quote.notes ? (
                        <p className="mt-4 text-[13px] text-ink">{quote.notes}</p>
                    ) : null}

                    <p className="money mt-6 text-[20px] font-semibold tracking-tight text-ink">
                        Total {formatDzd(quote.total_cents)}
                    </p>

                    <div className="mt-8 border-t border-hairline pt-6">
                        {accepted ? (
                            <p className="inline-flex items-center gap-2 text-[13px] font-medium text-ink">
                                <CheckCircle className="size-4" weight="fill" />
                                Accepted
                                {quote.accepted_at
                                    ? ` ${new Date(quote.accepted_at).toLocaleDateString('en-GB')}`
                                    : ''}
                            </p>
                        ) : (
                            <Form
                                action={
                                    quote.accept_url ??
                                    `${window.location.pathname}/accept`
                                }
                                method="post"
                            >
                                {({ processing }) => (
                                    <Button
                                        disabled={processing}
                                        className="h-10 bg-brand px-5 text-white hover:bg-brand-hover"
                                    >
                                        Accept quote
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
