import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { contacts as allContacts } from '../data/evocrm-demo-data';
import { contactName, formatDa, formatFullDate } from '../data/format';
import {
    SOURCE_LABELS,
    getAllContacts,
    getCompany,
    getDealsForContact,
    getOwner,
    getWonDeals,
} from '../data/selectors';

const VIEWS = [
    { id: 'tous', label: 'Tous' },
    { id: 'clients', label: 'Clients' },
    { id: 'leads', label: 'Leads' },
    { id: 'autres', label: 'Autres' },
    { id: 'unassigned', label: 'Non assignés' },
    { id: 'wa', label: 'WA' },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];

export function ContactsListPage() {
    const [view, setView] = useState<ViewId>('tous');
    const wonIds = new Set(getWonDeals().map((deal) => deal.contactId));
    const rows = useMemo(() => {
        return getAllContacts().filter((contact) => {
            const deals = getDealsForContact(contact.id);

            if (view === 'clients') {
                return wonIds.has(contact.id);
            }

            if (view === 'leads') {
                return Boolean(contact.sourceCampaignId);
            }

            if (view === 'autres') {
                return contact.source === 'autres';
            }

            if (view === 'unassigned') {
                return deals.length === 0;
            }

            if (view === 'wa') {
                return contact.source === 'whatsapp';
            }

            return true;
        });
    }, [view, wonIds]);
    const [selectedId, setSelectedId] = useState(rows[0]?.id ?? allContacts[0]?.id);
    const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
    const selectedDeal = selected ? getDealsForContact(selected.id)[0] : undefined;

    return (
        <div className="flex h-[calc(100dvh-48px)] min-h-[640px] flex-col md:h-[calc(100dvh-40px)]">
            <PageHeader
                title="Contacts"
                descriptor={`${rows.length} fiches · septembre 2026`}
                context={VIEWS.map((item) => (
                    <ContextChip key={item.id} active={view === item.id} onClick={() => setView(item.id)}>
                        {item.label}
                    </ContextChip>
                ))}
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Contact
                    </Button>
                }
            />

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white xl:grid-cols-[176px_minmax(0,1fr)_300px]">
                <aside className="hidden border-r border-[var(--evo-hairline)] xl:block">
                    <p className="px-3 pt-3 pb-1 text-[11px] text-[var(--evo-ink-muted)]">Vues</p>
                    {VIEWS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setView(item.id)}
                            className={
                                view === item.id
                                    ? 'flex h-8 w-full items-center px-3 text-left text-[13px] font-medium text-[var(--evo-teal)]'
                                    : 'flex h-8 w-full items-center px-3 text-left text-[13px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                            }
                        >
                            {item.label}
                        </button>
                    ))}
                </aside>

                <div className="min-w-0 overflow-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead className="sticky top-0 bg-white text-[11px] text-[var(--evo-ink-muted)]">
                            <tr className="border-b border-[var(--evo-hairline)]">
                                <th className="px-4 py-2 font-medium">Contact</th>
                                <th className="px-4 py-2 font-medium">Société</th>
                                <th className="px-4 py-2 font-medium">Source</th>
                                <th className="px-4 py-2 font-medium">Owner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((contact) => {
                                const active = selected?.id === contact.id;

                                return (
                                    <tr
                                        key={contact.id}
                                        className={active ? 'bg-[var(--evo-teal-soft)]' : 'hover:bg-[var(--evo-hover)]'}
                                        onClick={() => setSelectedId(contact.id)}
                                    >
                                        <td className="px-4 py-2.5">
                                            <LabLink
                                                to={{ name: 'contact', id: contact.id }}
                                                className="font-medium text-[var(--evo-teal)] hover:underline"
                                            >
                                                {contactName(contact)}
                                            </LabLink>
                                            <p className="text-[12px] text-[var(--evo-ink-muted)]">{contact.email}</p>
                                        </td>
                                        <td className="px-4 py-2.5">{getCompany(contact.companyId).name}</td>
                                        <td className="px-4 py-2.5">{SOURCE_LABELS[contact.source]}</td>
                                        <td className="px-4 py-2.5">{getOwner(contact.ownerId).initials}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <aside className="hidden overflow-auto border-l border-[var(--evo-hairline)] xl:block">
                    {selected ? (
                        <div className="px-4 py-4">
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">{selected.title}</p>
                            <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em]">
                                {contactName(selected)}
                            </h2>
                            <p className="mt-1 text-[13px]">{getCompany(selected.companyId).name}</p>
                            <dl className="mt-4 space-y-2 text-[13px]">
                                <div>
                                    <dt className="text-[var(--evo-ink-muted)]">Source</dt>
                                    <dd>{SOURCE_LABELS[selected.source]}</dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--evo-ink-muted)]">Owner</dt>
                                    <dd>{getOwner(selected.ownerId).name}</dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--evo-ink-muted)]">Créé</dt>
                                    <dd>{formatFullDate(selected.createdAt)}</dd>
                                </div>
                            </dl>
                            {selectedDeal ? (
                                <p className="mt-4 text-[13px]">
                                    <LabLink
                                        to={{ name: 'deal', id: selectedDeal.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {selectedDeal.name}
                                    </LabLink>
                                    <span className="block text-[12px] text-[var(--evo-ink-muted)]">
                                        {formatDa(selectedDeal.value)}
                                    </span>
                                </p>
                            ) : (
                                <p className="mt-4 text-[12px] text-[var(--evo-ink-muted)]">Aucune affaire liée.</p>
                            )}
                            <LabLink
                                to={{ name: 'contact', id: selected.id }}
                                className="mt-5 inline-flex text-[13px] font-medium text-[var(--evo-teal)] hover:underline"
                            >
                                Ouvrir la fiche
                            </LabLink>
                        </div>
                    ) : (
                        <p className="px-4 py-6 text-[13px] text-[var(--evo-ink-muted)]">Aucune fiche dans cette vue.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}
