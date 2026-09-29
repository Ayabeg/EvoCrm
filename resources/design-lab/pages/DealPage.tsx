import { Button } from '../components/Button';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { deals } from '../data/evocrm-demo-data';
import { contactName, formatDa, formatFullDate } from '../data/format';
import {
    QUOTE_STATUS_LABELS,
    SOURCE_LABELS,
    STAGE_LABELS,
    getActivitiesForDeal,
    getCampaign,
    getCompany,
    getContact,
    getConversationForContact,
    getOwner,
    getQuotesForDeal,
} from '../data/selectors';

type Props = {
    id: string;
};

export function DealPage({ id }: Props) {
    const deal = deals.find((row) => row.id === id);

    if (!deal) {
        return <p className="text-[14px] text-[var(--evo-ink-muted)]">Affaire introuvable.</p>;
    }

    const contact = getContact(deal.contactId);
    const company = getCompany(deal.companyId);
    const quotes = getQuotesForDeal(deal.id);
    const activities = getActivitiesForDeal(deal.id);
    const campaign = deal.sourceCampaignId ? getCampaign(deal.sourceCampaignId) : null;
    const conversation = getConversationForContact(contact.id);
    const nearby = deals
        .filter((row) => row.status === 'open' || row.id === deal.id)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return (
        <div>
            <PageHeader
                eyebrow="Affaires"
                title={deal.name}
                descriptor={`${company.name} · ${formatDa(deal.value)}`}
                context={
                    <>
                        <ContextChip active>{STAGE_LABELS[deal.stage]}</ContextChip>
                        <ContextChip>{getOwner(deal.ownerId).initials}</ContextChip>
                    </>
                }
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Activité
                    </Button>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
                <aside className="hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white xl:block">
                    <p className="px-3 pt-3 pb-1 text-[11px] text-[var(--evo-ink-muted)]">À proximité</p>
                    {nearby.map((row) => (
                        <LabLink
                            key={row.id}
                            to={{ name: 'deal', id: row.id }}
                            className={
                                row.id === deal.id
                                    ? 'block px-3 py-2 text-[13px] font-medium text-[var(--evo-teal)]'
                                    : 'block px-3 py-2 text-[13px] text-[var(--evo-ink-secondary)] hover:bg-[var(--evo-hover)]'
                            }
                        >
                            {row.name}
                            <span className="mt-0.5 block text-[11px] font-normal text-[var(--evo-ink-muted)]">
                                {formatDa(row.value)}
                            </span>
                        </LabLink>
                    ))}
                </aside>

                <div className="space-y-6">
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4">
                        <h2 className="text-[15px] font-semibold">Affaire</h2>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Étape</dt>
                                <dd>{STAGE_LABELS[deal.stage]}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Statut</dt>
                                <dd>
                                    {deal.status === 'open' ? 'Ouverte' : deal.status === 'won' ? 'Gagnée' : 'Perdue'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Valeur</dt>
                                <dd className="tabular-nums">{formatDa(deal.value)}</dd>
                            </div>
                            <div>
                                <dt className="text-[var(--evo-ink-muted)]">Créée</dt>
                                <dd>{formatFullDate(deal.createdAt)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                        <header className="px-5 py-3">
                            <h2 className="text-[15px] font-semibold">Prochaine action</h2>
                        </header>
                        {activities[0] ? (
                            <div className="px-5 pb-4 text-[13px]">
                                <p className="font-medium">{activities[0].title}</p>
                                <p className="mt-1 text-[var(--evo-ink-muted)]">
                                    {activities[0].type} · {getOwner(activities[0].ownerId).name}
                                </p>
                            </div>
                        ) : (
                            <p className="px-5 pb-4 text-[13px] text-[var(--evo-ink-muted)]">
                                Aucune activité ouverte.
                            </p>
                        )}
                    </section>

                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                        <header className="px-5 py-3">
                            <h2 className="text-[15px] font-semibold">Devis</h2>
                        </header>
                        <ul>
                            {quotes.map((quote) => (
                                <li
                                    key={quote.id}
                                    className="flex items-center justify-between border-t border-[var(--evo-hairline)] px-5 py-3"
                                >
                                    <LabLink
                                        to={{ name: 'devis', id: quote.id }}
                                        className="text-[13px] font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {quote.number}
                                    </LabLink>
                                    <span className="text-[13px] text-[var(--evo-ink-muted)]">
                                        {QUOTE_STATUS_LABELS[quote.status]} · {formatDa(quote.value)}
                                    </span>
                                </li>
                            ))}
                            {quotes.length === 0 ? (
                                <li className="px-5 pb-4 text-[13px] text-[var(--evo-ink-muted)]">Aucun devis.</li>
                            ) : null}
                        </ul>
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                        <h2 className="text-[15px] font-semibold">Contact</h2>
                        <LabLink
                            to={{ name: 'contact', id: contact.id }}
                            className="mt-2 block font-medium text-[var(--evo-teal)] hover:underline"
                        >
                            {contactName(contact)}
                        </LabLink>
                        <p className="mt-1 text-[var(--evo-ink-muted)]">{contact.email}</p>
                    </section>
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                        <h2 className="text-[15px] font-semibold">Société</h2>
                        <p className="mt-2">{company.name}</p>
                        <p className="text-[var(--evo-ink-muted)]">
                            {company.city} · {company.sector}
                        </p>
                    </section>
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                        <h2 className="text-[15px] font-semibold">Source</h2>
                        <p className="mt-2">{SOURCE_LABELS[deal.source]}</p>
                        {campaign ? (
                            <LabLink
                                to={{ name: 'campaign', id: campaign.id }}
                                className="mt-1 block text-[var(--evo-teal)] hover:underline"
                            >
                                {campaign.name}
                            </LabLink>
                        ) : (
                            <p className="mt-1 text-[var(--evo-ink-muted)]">Organique</p>
                        )}
                    </section>
                    <section className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                        <h2 className="text-[15px] font-semibold">Inbox</h2>
                        {conversation ? (
                            <p className="mt-2 text-[var(--evo-ink-muted)]">{conversation.subject}</p>
                        ) : (
                            <p className="mt-2 text-[var(--evo-ink-muted)]">Pas de fil ouvert.</p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
