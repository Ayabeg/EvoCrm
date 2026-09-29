import { LabLink } from '../components/LabLink';
import { quotes } from '../data/evocrm-demo-data';
import { contactName, formatDa, formatFullDate } from '../data/format';
import {
    QUOTE_STATUS_LABELS,
    STAGE_LABELS,
    getCompany,
    getContact,
    getDeal,
    getOwner,
} from '../data/selectors';

type Props = {
    id: string;
};

export function DevisPage({ id }: Props) {
    const quote = quotes.find((row) => row.id === id);

    if (!quote) {
        return (
            <p className="text-[14px] text-[var(--evo-ink-muted)]">
                Devis introuvable dans le jeu de données septembre.
            </p>
        );
    }

    const contact = getContact(quote.contactId);
    const company = getCompany(quote.companyId);
    const deal = quote.dealId ? getDeal(quote.dealId) : null;

    return (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-5 py-6">
                <p className="text-[12px] text-[var(--evo-ink-muted)]">{quote.number}</p>
                <h2 className="mt-1 text-[22px] font-semibold">{quote.title}</h2>
                <p className="mt-4 text-[32px] font-semibold tabular-nums">{formatDa(quote.value)}</p>
                <p className="mt-2 text-[14px] text-[var(--evo-ink-secondary)]">
                    {QUOTE_STATUS_LABELS[quote.status]} · envoyé le {formatFullDate(quote.sentAt)}
                </p>
                <div className="mt-6 border-t border-[var(--evo-border-subtle)] pt-4 text-[13px]">
                    <p>
                        Destinataire{' '}
                        <LabLink
                            to={{ name: 'contact', id: contact.id }}
                            className="font-medium text-[var(--evo-teal)] hover:underline"
                        >
                            {contactName(contact)}
                        </LabLink>
                    </p>
                    <p className="mt-2">{company.name}</p>
                    <p className="mt-2 text-[var(--evo-ink-muted)]">{contact.email}</p>
                </div>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-4 py-4 text-[13px]">
                <h3 className="text-[15px] font-semibold">Propriétés</h3>
                <dl className="mt-4 space-y-3">
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Owner</dt>
                        <dd>{getOwner(quote.ownerId).name}</dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Deal</dt>
                        <dd>
                            {deal ? (
                                <LabLink
                                    to={{ name: 'deal', id: deal.id }}
                                    className="text-[var(--evo-teal)] hover:underline"
                                >
                                    {deal.name} · {STAGE_LABELS[deal.stage]} · {formatDa(deal.value)}
                                </LabLink>
                            ) : (
                                'Aucun deal lié'
                            )}
                        </dd>
                    </div>
                    {quote.acceptedAt ? (
                        <div>
                            <dt className="text-[var(--evo-ink-muted)]">Accepté</dt>
                            <dd>{formatFullDate(quote.acceptedAt)}</dd>
                        </div>
                    ) : null}
                    {quote.refusedAt ? (
                        <div>
                            <dt className="text-[var(--evo-ink-muted)]">Refusé</dt>
                            <dd>{formatFullDate(quote.refusedAt)}</dd>
                        </div>
                    ) : null}
                    {quote.expiredAt ? (
                        <div>
                            <dt className="text-[var(--evo-ink-muted)]">Expiré</dt>
                            <dd>{formatFullDate(quote.expiredAt)}</dd>
                        </div>
                    ) : null}
                </dl>
            </section>
        </div>
    );
}
