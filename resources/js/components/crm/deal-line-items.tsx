import { Form } from '@inertiajs/react';
import { formatDzd } from '@/components/crm/hub-chrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type CatalogProduct = {
    id: number;
    sku: string;
    name: string;
    unit_cents: number;
    currency?: string;
    active?: boolean;
};

export type DealLineItemRow = {
    id: number;
    product_id?: number | null;
    name: string;
    sku?: string | null;
    quantity: number;
    unit_cents: number;
    total_cents: number;
};

export default function DealLineItems({
    dealId,
    items,
    products,
}: {
    dealId: number;
    items?: DealLineItemRow[] | null;
    products?: CatalogProduct[] | null;
}) {
    const rows = items ?? [];
    const catalog = products ?? [];
    const subtotal = rows.reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
    const rolledUp = rows.length > 0;

    return (
        <section className="rounded border border-hairline bg-canvas p-3 text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-mute">Line items</h3>
                {rolledUp ? (
                    <span className="money text-[11px] text-ink">{formatDzd(subtotal)}</span>
                ) : (
                    <span className="text-[11px] text-mute">Manual amount</span>
                )}
            </div>
            <p className="mb-2 text-[11px] text-mute">
                Local catalog (DZD) until Evostock sync. Deal amount rolls up when there are items.
            </p>
            {rows.length === 0 ? (
                <p className="mb-2 text-[12px] text-mute">No products on this deal yet.</p>
            ) : (
                <div className="mb-2 overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                        <thead>
                            <tr className="text-[11px] uppercase text-mute">
                                <th className="py-1 font-medium">Product</th>
                                <th className="py-1 font-medium">SKU</th>
                                <th className="py-1 text-right font-medium">Qty</th>
                                <th className="py-1 text-right font-medium">Unit</th>
                                <th className="py-1 text-right font-medium">Total</th>
                                <th className="py-1" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-hairline">
                                    <td className="py-1.5 pr-2">{row.name}</td>
                                    <td className="py-1.5 pr-2 text-mute">{row.sku ?? '—'}</td>
                                    <td className="py-1.5 text-right">{row.quantity}</td>
                                    <td className="money py-1.5 text-right">{formatDzd(row.unit_cents)}</td>
                                    <td className="money py-1.5 text-right">{formatDzd(row.total_cents)}</td>
                                    <td className="py-1.5 pl-2 text-right">
                                        <Form
                                            action={`/crm/deals/${dealId}/line-items/${row.id}`}
                                            method="delete"
                                        >
                                            <Button variant="secondary" className="h-6 px-2 text-[11px]">
                                                Remove
                                            </Button>
                                        </Form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {catalog.length > 0 ? (
                <Form action={`/crm/deals/${dealId}/line-items`} method="post" className="grid grid-cols-3 gap-1" resetOnSuccess>
                    <select name="product_id" required className="col-span-2 h-7 rounded border border-hairline bg-canvas px-1 text-[11px] text-ink">
                        <option value="">Add product</option>
                        {catalog.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} · {product.sku} · {formatDzd(product.unit_cents)}
                            </option>
                        ))}
                    </select>
                    <Input name="quantity" type="number" min={1} defaultValue={1} className="h-7" />
                    <Button className="col-span-3 h-7 text-[11px]">Add line item</Button>
                </Form>
            ) : (
                <p className="text-[12px] text-mute">No active products in this workspace yet.</p>
            )}
        </section>
    );
}
