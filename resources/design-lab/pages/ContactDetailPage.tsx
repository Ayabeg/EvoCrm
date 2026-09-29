import { LabLink } from '../components/LabLink';
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
        return (
            <p className="text-[14px] text-[var(--evo-ink-muted)]">
                Contact introuvable dans le jeu de données septembre.
            </p>
        );
    }

    const company = getCompany(contact.companyId);
    const deals = getDealsForContact(contact.id);
    const quotes = getQuotesForContact(contact.id);
    const conversation = getConversationForContact(contact.id);

    return (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-4 py-4">
                <p className="text-[12px] text-[var(--evo-ink-muted)]">{contact.title}</p>
                <h2 className="mt-1 text-[22px] font-semibold">{contactName(contact)}</h2>
                <p className="mt-1 text-[14px] text-[var(--evo-ink-secondary)]">{company.name}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
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
                        <dt className="text-[var(--evo-ink-muted)]">Source</dt>
                        <dd>{SOURCE_LABELS[contact.source]}</dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Owner</dt>
                        <dd>{getOwner(contact.ownerId).name}</dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Créé</dt>
                        <dd>{formatFullDate(contact.createdAt)}</dd>
                    </div>
                </dl>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h3 className="text-[15px] font-semibold">Deals et devis</h3>
                </header>
                <ul className="divide-y divide-[var(--evo-border-subtle)]">
                    {deals.map((deal) => (
                        <li key={deal.id} className="px-4 py-3 text-[13px]">
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
                        <li key={quote.id} className="px-4 py-3 text-[13px]">
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
                        <li className="px-4 py-6 text-[13px] text-[var(--evo-ink-muted)]">
                            Aucun deal ni devis lié.
                        </li>
                    ) : null}
                </ul>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] xl:col-span-2">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h3 className="text-[15px] font-semibold">Inbox</h3>
                </header>
                {conversation ? (
                    <ol className="space-y-3 px-4 py-4">
                        {conversation.messages.map((message) => (
                            <li key={message.id} className="text-[13px]">
                                <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                    {message.from === 'contact' ? contactName(contact) : getOwner(contact.ownerId).name}
                                    {' · '}
                                    {formatDateTime(message.at)}
                                </p>
                                <p className="mt-1">{message.body}</p>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="px-4 py-6 text-[13px] text-[var(--evo-ink-muted)]">
                        Pas de conversation Inbox pour ce contact.
                    </p>
                )}
            </section>
        </div>
    );
}
