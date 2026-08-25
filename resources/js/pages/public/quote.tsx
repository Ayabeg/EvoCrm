import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { formatDzd } from '@/lib/money';

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
        items?: { name: string; quantity: number; unit_cents: number; total_cents: number }[];
    };
}) {
    return (
        <>
            <Head title={`Quote #${quote.id}`} />
            <div className="mx-auto max-w-2xl space-y-4 p-6">
                <h1 className="text-xl font-semibold">Quote #{quote.id}</h1>
                <p className="text-sm text-muted-foreground">
                    Status: {quote.status}
                    {quote.expires_at ? ` · Expires ${quote.expires_at}` : ''}
                </p>
                {quote.html ? (
                    <div className="rounded border border-hairline p-4" dangerouslySetInnerHTML={{ __html: quote.html }} />
                ) : (
                    <ul className="space-y-1 text-sm">
                        {(quote.items ?? []).map((item, index) => (
                            <li key={index}>
                                {item.name} × {item.quantity} · {formatDzd(item.total_cents)}
                            </li>
                        ))}
                    </ul>
                )}
                <p className="font-medium">Total {formatDzd(quote.total_cents)}</p>
                {quote.accepted_at ? (
                    <p className="text-sm">Accepted {quote.accepted_at}</p>
                ) : (
                    <Form action={`${window.location.pathname}/accept`} method="post">
                        {({ processing }) => (
                            <Button disabled={processing}>Accept quote</Button>
                        )}
                    </Form>
                )}
            </div>
        </>
    );
}
