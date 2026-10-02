/**
 * Evo Design System — LineItems
 * Registry: custom Evo
 * License: MIT (original)
 */

import { MoneyEditor } from '@/evo/crm/quote/MoneyEditor';
import type { QuoteLine } from '@/evo/crm/quote/types';
import { formatMoney } from '@/evo/lib/format';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { t } from '@/lib/i18n';

export function LineItems({
    items,
    editable = false,
    onChange,
    namePrefix = 'items',
}: {
    items: QuoteLine[];
    editable?: boolean;
    onChange?: (items: QuoteLine[]) => void;
    namePrefix?: string;
}) {
    const rows =
        items.length > 0 ? items : [{ name: '', quantity: 1, unitDzd: 0 }];

    function update(index: number, patch: Partial<QuoteLine>) {
        const next = rows.map((row, i) =>
            i === index ? { ...row, ...patch } : row,
        );
        onChange?.(next);
    }

    return (
        <div className="overflow-x-auto" data-evo="line-items">
            <table className="w-full min-w-[28rem] border-collapse text-[13px]">
                <thead>
                    <tr className="text-start text-[11px] text-[var(--evo-ink-muted)]">
                        <th className="pb-2 font-medium">{t('Item')}</th>
                        <th className="w-20 pb-2 font-medium">{t('Qty')}</th>
                        <th className="w-36 pb-2 font-medium">{t('Unit')}</th>
                        <th className="w-32 pb-2 text-end font-medium">
                            {t('Total')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const total = Math.round(
                            (row.quantity || 0) * (row.unitDzd || 0),
                        );

                        return (
                            <tr
                                key={row.id ?? index}
                                className="border-t border-[var(--evo-hairline)]"
                            >
                                <td className="py-2 pe-2">
                                    {editable ? (
                                        <Input
                                            name={`${namePrefix}[${index}][name]`}
                                            value={row.name}
                                            aria-label={t('Item')}
                                            className="h-8"
                                            onChange={(event) =>
                                                update(index, {
                                                    name: event.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <span>{row.name || t('—')}</span>
                                    )}
                                </td>
                                <td className="py-2 pe-2">
                                    {editable ? (
                                        <Input
                                            name={`${namePrefix}[${index}][quantity]`}
                                            inputMode="numeric"
                                            value={String(row.quantity)}
                                            aria-label={t('Qty')}
                                            className="h-8 tabular-nums"
                                            onChange={(event) =>
                                                update(index, {
                                                    quantity:
                                                        Number(
                                                            event.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            ),
                                                        ) || 0,
                                                })
                                            }
                                        />
                                    ) : (
                                        <span className="tabular-nums">
                                            {row.quantity}
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 pe-2">
                                    {editable ? (
                                        <>
                                            <input
                                                type="hidden"
                                                name={`${namePrefix}[${index}][unit_dzd]`}
                                                value={row.unitDzd}
                                            />
                                            <MoneyEditor
                                                value={row.unitDzd}
                                                onValueChange={(value) =>
                                                    update(index, {
                                                        unitDzd: value ?? 0,
                                                    })
                                                }
                                                label={t('Unit')}
                                            />
                                        </>
                                    ) : (
                                        <span className="tabular-nums">
                                            {formatMoney(row.unitDzd)}
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 text-end font-medium tabular-nums">
                                    {formatMoney(total)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {editable && onChange ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                        onChange([
                            ...rows,
                            { name: '', quantity: 1, unitDzd: 0 },
                        ])
                    }
                >
                    {t('Add line')}
                </Button>
            ) : null}
        </div>
    );
}
