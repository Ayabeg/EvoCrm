import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { contacts } from '../data/evocrm-demo-data';
import { contactName, formatDa, formatDateTime, formatFullDate } from '../data/format';
import {
    QUOTE_STATUS_LABELS,
    SOURCE_LABELS,
    STAGE_LABELS,
    getCompany,
    getConversationForContact,
    getDealsForContact,
    getOwner,
    getQuotesForContact,
} from '../data/selectors';

type Props = {
    id: string;
};

export function ContactDetailPage({ id }: Props) {
    const contact = contacts.find((row) => row.id === id);

    if (!contact) {
        return <p className="text-[14px] text-[var(--evo-ink-muted)]">Contact introuvable.</p>;
    }

    const company = getCompany(contact.companyId);
    const deals = getDealsForContact(contact.id);
    const quotes = getQuotesForContact(contact.id);
    const conversation = getConversationForContact(contact.id);

    return (
        <div>
            <PageHeader
                eyebrow="Contacts"
                title={contactName(contact)}
                descriptor={`${company.name} · ${contact.title}`}
                context={
                    <>
                        <ContextChip>{SOURCE_LABELS[contact.source]}</ContextChip>
                        <ContextChip>{getOwner(contact.ownerId).initials}</ContextChip>
                    </>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <div className="space-y-6">
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4">
                        <h2 className="text-[15px] font-semibold">Coordonnées</h2>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Email</dt>
                                <dd>{contact.email}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Téléphone</dt>
                                <dd>{contact.phone}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Ville</dt>
                                <dd>{contact.city}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Créé</dt>
                                <dd>{formatFullDate(contact.createdAt)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                        <header className="px-5 py-3">
                            <h2 className="text-[15px] font-semibold">Affaires et devis</h2>
                        </header>
                        <ul className="divide-y divide-[var(--evo-hairline)]">
                            {deals.map((deal) => (
                                <li key={deal.id} className="px-5 py-3 text-[13px]">
                                    <LabLink
                                        to={{ name: 'deal', id: deal.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {deal.name}
                                    </LabLink>
                                    <p className="mt-1 text-[var(--evo-ink-muted)]">
                                        {STAGE_LABELS[deal.stage]} · {formatDa(deal.value)}
                                    </p>
                                </li>
                            ))}
                            {quotes.map((quote) => (
                                <li key={quote.id} className="px-5 py-3 text-[13px]">
                                    <LabLink
                                        to={{ name: 'devis', id: quote.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {quote.number}
                                    </LabLink>
                                    <p className="mt-1 text-[var(--evo-ink-muted)]">
                                        {QUOTE_STATUS_LABELS[quote.status]} · {formatDa(quote.value)}
                                    </p>
                                </li>
                            ))}
                            {deals.length === 0 && quotes.length === 0 ? (
                                <li className="px-5 py-5 text-[13px] text-[var(--evo-ink-muted)]">
                                    Aucun deal ni devis lié.
                                </li>
                            ) : null}
                        </ul>
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4">
                        <h2 className="text-[15px] font-semibold">Société</h2>
                        <p className="mt-2 text-[13px]">{company.name}</p>
                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                            {company.city} · {company.sector}
                        </p>
                    </section>
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                        <header className="px-5 py-3">
                            <h2 className="text-[15px] font-semibold">Inbox</h2>
                        </header>
                        {conversation ? (
                            <ol className="space-y-3 px-5 pb-4">
                                {conversation.messages.map((message) => (
                                    <li key={message.id} className="text-[13px]">
                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                            {message.from === 'contact'
                                                ? contactName(contact)
                                                : getOwner(contact.ownerId).name}
                                            {' · '}
                                            {formatDateTime(message.at)}
                                        </p>
                                        <p className="mt-1">{message.body}</p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="px-5 pb-4 text-[13px] text-[var(--evo-ink-muted)]">
                                Pas de conversation Inbox.
                            </p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
