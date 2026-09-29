import { LabLink } from '../components/LabLink';
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
    getOwner,
    getQuotesForDeal,
} from '../data/selectors';

type Props = {
    id: string;
};

export function DealPage({ id }: Props) {
    const deal = deals.find((row) => row.id === id);

    if (!deal) {
        return (
            <p className="text-[14px] text-[var(--evo-ink-muted)]">
                Deal introuvable dans le jeu de données septembre.
            </p>
        );
    }

    const contact = getContact(deal.contactId);
    const company = getCompany(deal.companyId);
    const quotes = getQuotesForDeal(deal.id);
    const activities = getActivitiesForDeal(deal.id);
    const campaign = deal.sourceCampaignId ? getCampaign(deal.sourceCampaignId) : null;

    return (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] px-4 py-4">
                <p className="text-[12px] text-[var(--evo-ink-muted)]">{company.name}</p>
                <h2 className="mt-1 text-[22px] font-semibold">{deal.name}</h2>
                <p className="mt-2 text-[28px] font-semibold tabular-nums">{formatDa(deal.value)}</p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Étape</dt>
                        <dd>{STAGE_LABELS[deal.stage]}</dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Statut</dt>
                        <dd>{deal.status === 'open' ? 'Ouvert' : deal.status === 'won' ? 'Gagné' : 'Perdu'}</dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Owner</dt>
                        <dd>
                            {getOwner(deal.ownerId).name} ({getOwner(deal.ownerId).initials})
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Source</dt>
                        <dd>
                            {SOURCE_LABELS[deal.source]}
                            {campaign ? ` · ${campaign.name}` : ''}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Contact</dt>
                        <dd>
                            <LabLink
                                to={{ name: 'contact', id: contact.id }}
                                className="text-[var(--evo-teal)] hover:underline"
                            >
                                {contactName(contact)}
                            </LabLink>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[var(--evo-ink-muted)]">Créé</dt>
                        <dd>{formatFullDate(deal.createdAt)}</dd>
                    </div>
                    {deal.wonAt ? (
                        <div>
                            <dt className="text-[var(--evo-ink-muted)]">Gagné le</dt>
                            <dd>{formatFullDate(deal.wonAt)}</dd>
                        </div>
                    ) : null}
                </dl>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)]">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h3 className="text-[15px] font-semibold">Devis liés</h3>
                </header>
                <ul>
                    {quotes.map((quote) => (
                        <li
                            key={quote.id}
                            className="flex items-center justify-between border-b border-[var(--evo-border-subtle)] px-4 py-3 last:border-0"
                        >
                            <div>
                                <LabLink
                                    to={{ name: 'devis', id: quote.id }}
                                    className="text-[13px] font-medium text-[var(--evo-teal)] hover:underline"
                                >
                                    {quote.number}
                                </LabLink>
                                <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                    {QUOTE_STATUS_LABELS[quote.status]}
                                </p>
                            </div>
                            <p className="text-[13px] tabular-nums">{formatDa(quote.value)}</p>
                        </li>
                    ))}
                    {quotes.length === 0 ? (
                        <li className="px-4 py-6 text-[13px] text-[var(--evo-ink-muted)]">
                            Aucun devis.
                        </li>
                    ) : null}
                </ul>
            </section>

            <section className="border border-[var(--evo-border)] bg-[var(--evo-surface)] xl:col-span-2">
                <header className="border-b border-[var(--evo-border-subtle)] px-4 py-3">
                    <h3 className="text-[15px] font-semibold">Activités</h3>
                </header>
                <ul>
                    {activities.map((activity) => (
                        <li key={activity.id} className="border-b border-[var(--evo-border-subtle)] px-4 py-3 last:border-0">
                            <p className="text-[13px] font-medium">{activity.title}</p>
                            <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                {activity.type} · {getOwner(activity.ownerId).initials}
                            </p>
                        </li>
                    ))}
                    {activities.length === 0 ? (
                        <li className="px-4 py-6 text-[13px] text-[var(--evo-ink-muted)]">
                            Pas d'activité ouverte sur ce deal.
                        </li>
                    ) : null}
                </ul>
            </section>
        </div>
    );
}
