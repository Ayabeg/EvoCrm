import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CatalogProduct } from '@/components/crm/deal-line-items';
import { formatDzd } from '@/lib/money';

type QuoteItem = {
    id?: number;
    name: string;
    quantity: number;
    unit_cents: number;
    total_cents: number;
};

type QuoteRow = {
    id: number;
    status: string;
    total_cents: number;
    notes?: string | null;
    sent_at?: string | null;
    accepted_at?: string | null;
    expires_at?: string | null;
    items?: QuoteItem[];
};

export default function DealQuotes({
    dealId,
    quotes,
    products,
}: {
    dealId: number;
    quotes: QuoteRow[];
    products?: CatalogProduct[];
}) {
    const catalog = products ?? [];

    return (
        <section className="rounded border border-hairline bg-canvas p-3 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Quotes</h3>
            {quotes.length === 0 ? (
                <p className="mb-2 text-[12px] text-mute">No quotes yet.</p>
            ) : (
                <div className="mb-3 space-y-3">
                    {quotes.map((quote) => (
                        <div key={quote.id} className="rounded border border-hairline p-2">
                            <p className="text-[12px] font-medium">
                                Quote #{quote.id} · {quote.status} · {formatDzd(quote.total_cents)}
                            </p>
                            {(quote.items ?? []).map((item, index) => (
                                <p key={item.id ?? index} className="text-[11px] text-mute">
                                    {item.name} × {item.quantity}
                                </p>
                            ))}
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button asChild variant="outline" className="h-7 text-[11px]">
                                    <a href={`/crm/quotes/${quote.id}/preview`} target="_blank" rel="noreferrer">
                                        Preview PDF
                                    </a>
                                </Button>
                                <Form action={`/crm/quotes/${quote.id}/send`} method="post" className="flex gap-1">
                                    <Input name="to" type="email" placeholder="Customer email" className="h-7 w-44" />
                                    <Button className="h-7 text-[11px]">Email quote</Button>
                                </Form>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Form action={`/crm/deals/${dealId}/quotes`} method="post" className="grid gap-1" resetOnSuccess>
                <select name="items[0][product_id]" className="h-7 rounded border border-hairline bg-canvas px-1 text-[11px]">
                    <option value="">Ad hoc item</option>
                    {catalog.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name}
                        </option>
                    ))}
                </select>
                <Input name="items[0][name]" placeholder="Line name" className="h-7" />
                <div className="grid grid-cols-2 gap-1">
                    <Input name="items[0][quantity]" type="number" min={1} defaultValue={1} className="h-7" />
                    <Input name="items[0][unit_dzd]" type="number" min={0} step="0.01" placeholder="DZD" className="h-7" />
                </div>
                <Input name="notes" placeholder="Notes" className="h-7" />
                <Button className="h-7 text-[11px]">Create quote</Button>
            </Form>
        </section>
    );
}
