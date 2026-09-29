import { useState } from 'react';
import { Button } from '../components/Button';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { formatDa } from '../data/format';
import { STAGE_LABELS, getAllDeals, getCompany, getOwner } from '../data/selectors';

export function DealsListPage() {
    const rows = getAllDeals();
    const [selectedId, setSelectedId] = useState(rows[0]?.id);

    return (
        <div>
            <PageHeader
                title="Affaires"
                descriptor={`${rows.length} affaires · septembre 2026`}
                context={<ContextChip active>Toutes</ContextChip>}
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Affaire
                    </Button>
                }
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Affaire</th>
                            <th className="px-4 py-2 font-medium">Société</th>
                            <th className="px-4 py-2 font-medium">Étape</th>
                            <th className="px-4 py-2 font-medium">Owner</th>
                            <th className="px-4 py-2 text-right font-medium">Valeur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((deal) => (
                            <tr
                                key={deal.id}
                                className={
                                    selectedId === deal.id
                                        ? 'bg-[var(--evo-teal-soft)]'
                                        : 'hover:bg-[var(--evo-hover)]'
                                }
                                onClick={() => setSelectedId(deal.id)}
                            >
                                <td className="px-4 py-2.5">
                                    <LabLink
                                        to={{ name: 'deal', id: deal.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {deal.name}
                                    </LabLink>
                                </td>
                                <td className="px-4 py-2.5">{getCompany(deal.companyId).name}</td>
                                <td className="px-4 py-2.5">{STAGE_LABELS[deal.stage]}</td>
                                <td className="px-4 py-2.5">{getOwner(deal.ownerId).initials}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatDa(deal.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
