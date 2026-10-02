import { Form } from '@inertiajs/react';
import { RecordDisclose } from '@/components/crm/record-hub';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { t } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';

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
        <section className="text-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold tracking-wide text-mute uppercase">{t('Line items')}</h3>
                {rolledUp ? (
                    <span className="money text-[11px] text-ink">{formatDzd(subtotal)}</span>
                ) : (
                    <span className="text-[11px] text-mute">{t('Manual amount')}</span>
                )}
            </div>
            {rows.length === 0 ? (
                <p className="mb-2 text-[12px] text-mute">{t('No products on this deal yet.')}</p>
            ) : (
                <div className="mb-2 overflow-x-auto">
                    <table className="w-full text-start text-[12px]">
                        <thead>
                            <tr className="text-[11px] uppercase text-mute">
                                <th className="py-1 font-medium">{t('Product')}</th>
                                <th className="py-1 font-medium">{t('SKU')}</th>
                                <th className="py-1 text-end font-medium">{t('Qty')}</th>
                                <th className="py-1 text-end font-medium">{t('Unit')}</th>
                                <th className="py-1 text-end font-medium">{t('Total')}</th>
                                <th className="py-1" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-hairline">
                                    <td className="py-1.5 pe-2" colSpan={5}>
                                        <Form
                                            action={`/crm/deals/${dealId}/line-items/${row.id}`}
                                            method="put"
                                            className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-1"
                                        >
                                            <input
                                                name="name"
                                                defaultValue={row.name}
                                                className="h-6 rounded border border-hairline bg-canvas px-1 text-[11px]"
                                            />
                                            <Input
                                                name="quantity"
                                                type="number"
                                                min={1}
                                                defaultValue={row.quantity}
                                                className="h-6"
                                            />
                                            <Input
                                                name="unit_dzd"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                defaultValue={(row.unit_cents / 100).toFixed(2)}
                                                className="h-6"
                                            />
                                            <Button variant="outline" className="h-6 px-2 text-[11px]">{t('Save')}</Button>
                                        </Form>
                                    </td>
                                    <td className="py-1.5 ps-2 text-end">
                                        <Form
                                            action={`/crm/deals/${dealId}/line-items/${row.id}`}
                                            method="delete"
                                        >
                                            <Button variant="secondary" className="h-6 px-2 text-[11px]">
                                                {t('Remove')}
                                            </Button>
                                        </Form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <RecordDisclose label={t('Add line item')}>
                <p className="text-[11px] text-mute">
                    {t('Local catalog (DA) until Evostock sync. Deal amount rolls up when there are items.')}
                </p>
                <Form action={`/crm/deals/${dealId}/line-items`} method="post" className="grid grid-cols-3 gap-1" resetOnSuccess>
                    <select name="product_id" className="col-span-2 h-7 rounded border border-hairline bg-canvas px-1 text-[11px] text-ink">
                        <option value="">{t('Ad hoc or catalog…')}</option>
                        {catalog.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} · {product.sku} · {formatDzd(product.unit_cents)}
                            </option>
                        ))}
                    </select>
                    <Input name="quantity" type="number" min={1} defaultValue={1} className="h-7" />
                    <Input name="name" placeholder={t('Ad hoc name')} className="col-span-2 h-7" />
                    <Input name="unit_dzd" type="number" min={0} step="0.01" placeholder={t('DA')} className="h-7" />
                    <Button variant="outline" className="col-span-3 h-7 text-[11px]">{t('Add line item')}</Button>
                </Form>
            </RecordDisclose>
        </section>
    );
}
