import { Button } from '../components/Button';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { PrototypeRoom } from '../components/PrototypeRoom';
import { companies, leads, quotes } from '../data/evocrm-demo-data';
import { contactName, formatCount, formatDa } from '../data/format';
import {
    QUOTE_STATUS_LABELS,
    SOURCE_LABELS,
    getContact,
    getOpenActivities,
    getOutboundSequences,
    getOwner,
} from '../data/selectors';

export function CompaniesPage() {
    const rows = companies;

    return (
        <div>
            <PageHeader
                title="Sociétés"
                descriptor={`${rows.length} comptes · septembre 2026`}
                context={<ContextChip active>Toutes</ContextChip>}
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Société
                    </Button>
                }
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Société</th>
                            <th className="px-4 py-2 font-medium">Ville</th>
                            <th className="px-4 py-2 font-medium">Secteur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, 24).map((company) => (
                            <tr key={company.id} className="border-b border-[var(--evo-hairline)] last:border-0">
                                <td className="px-4 py-2.5 font-medium">{company.name}</td>
                                <td className="px-4 py-2.5">{company.city}</td>
                                <td className="px-4 py-2.5">{company.sector}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function CompanyPage({ id }: { id: string }) {
    const company = companies.find((row) => row.id === id);

    if (!company) {
        return <p className="text-[14px] text-[var(--evo-ink-muted)]">Société introuvable.</p>;
    }

    return (
        <PrototypeRoom
            title={company.name}
            descriptor={`${company.city} · ${company.sector}`}
            rows={[
                { label: 'Ville', value: company.city },
                { label: 'Secteur', value: company.sector },
                { label: 'Domaine', value: company.domain },
            ]}
        />
    );
}

export function LeadsPage() {
    return (
        <div>
            <PageHeader
                title="Leads"
                descriptor={`${leads.length} leads · 86 issus des pubs`}
                context={<ContextChip active>Inbox</ContextChip>}
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Lead</th>
                            <th className="px-4 py-2 font-medium">Source</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 font-medium">Owner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.slice(0, 30).map((lead) => {
                            const contact = getContact(lead.contactId);

                            return (
                                <tr key={lead.id} className="border-b border-[var(--evo-hairline)] last:border-0">
                                    <td className="px-4 py-2.5">
                                        <LabLink
                                            to={{ name: 'contact', id: contact.id }}
                                            className="font-medium text-[var(--evo-teal)] hover:underline"
                                        >
                                            {contactName(contact)}
                                        </LabLink>
                                    </td>
                                    <td className="px-4 py-2.5">{SOURCE_LABELS[lead.source]}</td>
                                    <td className="px-4 py-2.5">{lead.status}</td>
                                    <td className="px-4 py-2.5">{getOwner(lead.ownerId).initials}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function QuotesListPage() {
    return (
        <div>
            <PageHeader
                title="Devis"
                descriptor={`${quotes.length} envoyés · septembre 2026`}
                context={<ContextChip active>Tous</ContextChip>}
                actions={
                    <Button variant="primary" disabled title="Prototype — création non branchée">
                        + Devis
                    </Button>
                }
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Numéro</th>
                            <th className="px-4 py-2 font-medium">Titre</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 text-right font-medium">Valeur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.slice(0, 24).map((quote) => (
                            <tr key={quote.id} className="border-b border-[var(--evo-hairline)] last:border-0">
                                <td className="px-4 py-2.5">
                                    <LabLink
                                        to={{ name: 'devis', id: quote.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {quote.number}
                                    </LabLink>
                                </td>
                                <td className="px-4 py-2.5">{quote.title}</td>
                                <td className="px-4 py-2.5">{QUOTE_STATUS_LABELS[quote.status]}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatDa(quote.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ActivitiesPage() {
    const rows = getOpenActivities();

    return (
        <div>
            <PageHeader
                title="Activités"
                descriptor={`${rows.length} ouvertes`}
                context={<ContextChip active>À faire</ContextChip>}
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <ul>
                    {rows.map((activity) => (
                        <li
                            key={activity.id}
                            className="flex items-center justify-between border-b border-[var(--evo-hairline)] px-4 py-3 last:border-0 text-[13px]"
                        >
                            <div>
                                <p className="font-medium">{activity.title}</p>
                                <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                    {activity.type} · {getOwner(activity.ownerId).initials}
                                </p>
                            </div>
                            {activity.dealId ? (
                                <LabLink
                                    to={{ name: 'deal', id: activity.dealId }}
                                    className="text-[var(--evo-teal)] hover:underline"
                                >
                                    Ouvrir
                                </LabLink>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function OutboundPage({ view = 'overview' }: { view?: string }) {
    const sequences = getOutboundSequences();

    if (view !== 'overview' && view !== 'sequences') {
        return (
            <PrototypeRoom
                title="Outbound"
                descriptor="Prospecter · septembre 2026"
                rows={[
                    { label: 'Vue', value: view },
                    { label: 'Séquences actives', value: formatCount(sequences.length) },
                    { label: 'Envois', value: formatCount(sequences.reduce((sum, row) => sum + row.sent, 0)) },
                ]}
            />
        );
    }

    return (
        <div>
            <PageHeader
                title="Outbound"
                descriptor="Vue d’ensemble · septembre 2026"
                context={<ContextChip active>Séquences</ContextChip>}
            />
            <div className="overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white">
                <table className="w-full text-left text-[13px]">
                    <thead className="text-[11px] text-[var(--evo-ink-muted)]">
                        <tr className="border-b border-[var(--evo-hairline)]">
                            <th className="px-4 py-2 font-medium">Séquence</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                            <th className="px-4 py-2 text-right font-medium">Envois</th>
                            <th className="px-4 py-2 text-right font-medium">Réponses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sequences.map((row) => (
                            <tr key={row.id} className="border-b border-[var(--evo-hairline)] last:border-0">
                                <td className="px-4 py-2.5 font-medium">{row.name}</td>
                                <td className="px-4 py-2.5">{row.status === 'active' ? 'Active' : 'Pause'}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(row.sent)}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(row.replies)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function TicketsPage() {
    return (
        <PrototypeRoom
            title="Tickets"
            descriptor="Servir · après-vente"
            rows={[
                { label: 'Ouverts', value: '0 ce mois (jeu démo)' },
                { label: 'Période', value: 'Septembre 2026' },
            ]}
            note="Aucun ticket n’est dans le jeu validé. Le chassis reste identique."
        />
    );
}

export function SegmentsPage() {
    return (
        <PrototypeRoom
            title="Segments"
            descriptor="Automatiser"
            rows={[
                { label: 'Leads pubs', value: '86' },
                { label: 'WA Cliniques Alger', value: '42' },
            ]}
        />
    );
}

export function WorkflowsPage() {
    return (
        <PrototypeRoom
            title="Workflows"
            descriptor="Automatiser"
            rows={[
                { label: 'Relance devis', value: 'Actif' },
                { label: 'Suivi leads Ads', value: 'Actif' },
            ]}
        />
    );
}

export function SettingsPage() {
    return (
        <div>
            <PageHeader title="Paramètres" descriptor="Espace de travail · EvoCRM Santé" />
            <div className="rounded-[8px] border border-[var(--evo-hairline)] bg-white px-5 py-4 text-[13px]">
                <p>Période figée : 1–30 septembre 2026, Africa/Algiers.</p>
                <p className="mt-2 text-[var(--evo-ink-muted)]">
                    Les totaux de ce Design Lab restent ceux du jeu validé. Rien ici ne les recalcule.
                </p>
                <p className="mt-4 text-[12px] tracking-[0.06em] text-[var(--evo-ink-faint)]">DEMO · SEPT 2026</p>
            </div>
        </div>
    );
}

