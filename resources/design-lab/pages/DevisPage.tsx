import { Button } from '../components/Button';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { quotes } from '../data/evocrm-demo-data';
import { contactName, formatDa, formatFullDate } from '../data/format';
import { STAGE_LABELS, getCompany, getContact, getDeal, getOwner } from '../data/selectors';

const LIFECYCLE = ['Brouillon', 'Envoyé', 'En attente', 'Accepté'] as const;

type Props = {
    id: string;
};

export function DevisPage({ id }: Props) {
    const quote = quotes.find((row) => row.id === id);

    if (!quote) {
        return <p className="text-[14px] text-[var(--evo-ink-muted)]">Devis introuvable.</p>;
    }

    const contact = getContact(quote.contactId);
    const company = getCompany(quote.companyId);
    const deal = quote.dealId ? getDeal(quote.dealId) : null;
    const current =
        quote.status === 'accepte' ? 'Accepté' : quote.status === 'en_attente' ? 'En attente' : 'Envoyé';

    return (
        <div>
            <PageHeader
                eyebrow="Devis"
                title={quote.number}
                descriptor={`${company.name} · ${contactName(contact)}`}
                context={<ContextChip active>{current}</ContextChip>}
                actions={
                    <Button variant="primary" disabled title="Prototype — envoi non branché">
                        Envoyer un rappel
                    </Button>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-8 py-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">EvoCRM Santé</p>
                            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">{quote.title}</h2>
                        </div>
                        <p className="text-[13px] text-[var(--evo-ink-muted)]">{quote.number}</p>
                    </div>
                    <p className="mt-8 text-[36px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                        {formatDa(quote.value)}
                    </p>
                    <p className="mt-2 text-[13px] text-[var(--evo-ink-muted)]">
                        Envoyé le {formatFullDate(quote.sentAt)}
                    </p>
                    <ol className="mt-8 flex flex-wrap gap-2">
                        {LIFECYCLE.map((step) => {
                            const active = step === current;

                            return (
                                <li
                                    key={step}
                                    className={
                                        active
                                            ? 'rounded-[8px] bg-[var(--evo-teal)] px-2.5 py-1 text-[12px] text-white'
                                            : 'rounded-[8px] bg-[var(--evo-canvas)] px-2.5 py-1 text-[12px] text-[var(--evo-ink-muted)]'
                                    }
                                >
                                    {step}
                                </li>
                            );
                        })}
                    </ol>
                    <div className="mt-10 border-t border-[var(--evo-hairline)] pt-5 text-[13px]">
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
                        <p className="mt-1 text-[var(--evo-ink-muted)]">{contact.email}</p>
                    </div>
                </section>

                <aside className="space-y-6">
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                        <h2 className="text-[15px] font-semibold">Contexte</h2>
                        <dl className="mt-3 space-y-3">
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Owner</dt>
                                <dd>{getOwner(quote.ownerId).name}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Affaire</dt>
                                <dd>
                                    {deal ? (
                                        <LabLink
                                            to={{ name: 'deal', id: deal.id }}
                                            className="text-[var(--evo-teal)] hover:underline"
                                        >
                                            {deal.name}
                                            <span className="mt-1 block text-[var(--evo-ink-muted)]">
                                                {STAGE_LABELS[deal.stage]} · {formatDa(deal.value)}
                                            </span>
                                        </LabLink>
                                    ) : (
                                        'Aucune affaire liée'
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </aside>
            </div>
        </div>
    );
}
