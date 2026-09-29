import { LabLink } from '../components/LabLink';
import { contactName, formatFullDate } from '../data/format';
import {
    SOURCE_LABELS,
    getAllContacts,
    getCompany,
    getDealsForContact,
    getOwner,
} from '../data/selectors';

export function ContactsListPage() {
    const rows = getAllContacts();

    return (
        <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
            <header className="flex items-center justify-between border-b border-[var(--evo-border-subtle)] px-4 py-3">
                <h2 className="text-[15px] font-semibold">Contacts</h2>
                <p className="text-[12px] text-[var(--evo-ink-muted)]">{rows.length} fiches</p>
            </header>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-border-subtle)]">
                            <th className="px-4 py-2 font-medium">Contact</th>
                            <th className="px-4 py-2 font-medium">Société</th>
                            <th className="px-4 py-2 font-medium">Source</th>
                            <th className="px-4 py-2 font-medium">Owner</th>
                            <th className="px-4 py-2 font-medium">Deal lié</th>
                            <th className="px-4 py-2 font-medium">Créé</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((contact) => {
                            const company = getCompany(contact.companyId);
                            const deal = getDealsForContact(contact.id)[0];

                            return (
                                <tr
                                    key={contact.id}
                                    className="border-b border-[var(--evo-border-subtle)] last:border-0 hover:bg-[var(--evo-hover)]"
                                >
                                    <td className="px-4 py-2.5">
                                        <LabLink
                                            to={{ name: 'contact', id: contact.id }}
                                            className="font-medium text-[var(--evo-teal)] hover:underline"
                                        >
                                            {contactName(contact)}
                                        </LabLink>
                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                            {contact.email}
                                        </p>
                                    </td>
                                    <td className="px-4 py-2.5">{company.name}</td>
                                    <td className="px-4 py-2.5">{SOURCE_LABELS[contact.source]}</td>
                                    <td className="px-4 py-2.5">{getOwner(contact.ownerId).initials}</td>
                                    <td className="px-4 py-2.5">
                                        {deal ? (
                                            <LabLink
                                                to={{ name: 'deal', id: deal.id }}
                                                className="hover:underline"
                                            >
                                                {deal.name}
                                            </LabLink>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-[var(--evo-ink-muted)]">
                                        {formatFullDate(contact.createdAt)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
