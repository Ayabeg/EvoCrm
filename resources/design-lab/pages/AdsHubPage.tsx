import { useEffect, useMemo, useState } from 'react';

import { AdsListToolbar } from '@/evo/ads';
import type { AdsListViewId } from '@/evo/ads';
import { ChartFrame, ComposedChart, FunnelChart, SankeyChart } from '@/evo/charts';
import { DataGrid } from '@/evo/data/data-grid';
import { CrmKpiStrip } from '@/evo/patterns/kpi';
import { Card, CardContent, CardHeader, CardTitle } from '@/evo/ui/card';
import { LabLink } from '../components/LabLink';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { PrototypeRoom } from '../components/PrototypeRoom';
import { useLabLoading } from '../components/useLabLoading';
import {
    formatCompactAxis,
    formatCount,
    formatDa,
    formatDayLabel,
    formatExactRoas,
    formatRoas,
} from '../data/format';
import {
    exactRoas,
    getAdsFunnel,
    getAdsTotals,
    getCampaignTotals,
    getDailyAdPerformanceForCampaign,
    getKnownObjects,
    getLeadSourceTotals,
    getSankeyDealFlow,
    getWonDeals,
} from '../data/selectors';

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function channelKind(channel: string): string {
    if (channel === 'whatsapp') {
        return 'Click-to-WhatsApp';
    }

    if (channel === 'instagram') {
        return 'Lead form';
    }

    if (channel === 'site_web') {
        return 'Lead form';
    }

    return 'Traffic';
}

type Props = {
    view?: string;
};

export function AdsHubPage({ view = 'overview' }: Props) {
    const loading = useLabLoading();
    const [search, setSearch] = useState('');
    const [listView, setListView] = useState<AdsListViewId>('all');
    const [theme] = useState<'light' | 'dark'>(() =>
        new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light',
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const ads = getAdsTotals();
    const campaignRows = getCampaignTotals();
    const daily = getDailyAdPerformanceForCampaign(null).map((row) => ({
        ...row,
        label: formatDayLabel(row.date),
    }));
    const funnel = getAdsFunnel();
    const won = getWonDeals().length;
    const flow = getSankeyDealFlow();
    const known = getKnownObjects();
    const sources = getLeadSourceTotals();
    const cpl = ads.leadsInbox > 0 ? Math.round(ads.spend / ads.leadsInbox) : 0;

    const filteredCampaigns = useMemo(() => {
        const query = search.trim().toLocaleLowerCase('fr-DZ');

        return campaignRows.filter((campaign) => {
            if (query && !`${campaign.name} ${campaign.channel}`.toLocaleLowerCase('fr-DZ').includes(query)) {
                return false;
            }

            if (listView === 'paused') {
                return false;
            }

            return true;
        });
    }, [campaignRows, listView, search]);

    if (view === 'accounts') {
        return (
            <PrototypeRoom
                title="Comptes"
                descriptor="Pubs · Meta · septembre 2026"
                rows={[
                    { label: 'Compte', value: 'Compte Meta EO' },
                    { label: 'Devise', value: 'DZD' },
                    { label: 'Campagnes', value: String(campaignRows.length) },
                ]}
                note="Un compte Meta. Les totaux restent ceux du jeu septembre validé."
            />
        );
    }

    if (view === 'leads') {
        return (
            <div className="space-y-5">
                <PageHeader title="Leads pubs" descriptor="Formulaires Instagram / Messenger · septembre 2026" />
                <DataGrid
                    columns={[
                        { id: 'source', header: 'Source', accessorFn: (row) => row.label },
                        {
                            id: 'count',
                            header: 'Leads',
                            accessorFn: (row) => row.count,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatCount(row.original.count)}</span>
                            ),
                        },
                        {
                            id: 'ads',
                            header: 'Attribués pubs',
                            accessorFn: (row) => row.adCount,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatCount(row.original.adCount)}</span>
                            ),
                        },
                    ]}
                    data={sources}
                    getRowId={(row) => row.source}
                    density="compact"
                    enableSelection={false}
                />
            </div>
        );
    }

    if (view === 'audiences') {
        const audiences = [
            {
                id: 'clinique',
                name: known.cliniqueElDjazair.company.name,
                note: 'Compte principal · Alger',
                channel: 'WhatsApp',
            },
            {
                id: 'cabinet',
                name: known.cabinetDrAmrani.company.name,
                note: 'Lead Instagram / Messenger',
                channel: 'Instagram',
            },
            {
                id: 'pharmacie',
                name: known.pharmacieCentrale.company.name,
                note: 'Après-vente · Blida',
                channel: 'Email',
            },
            {
                id: 'hopital',
                name: known.hopitalIbnSina.company.name,
                note: 'Appel d’offres · Oran',
                channel: 'Site web',
            },
        ];

        return (
            <div className="space-y-5">
                <PageHeader
                    title="Audiences"
                    descriptor="Segments CRM du monde démo · septembre 2026"
                />
                <DataGrid
                    columns={[
                        { id: 'name', header: 'Audience', accessorFn: (row) => row.name },
                        { id: 'channel', header: 'Canal', accessorFn: (row) => row.channel },
                        { id: 'note', header: 'Rôle', accessorFn: (row) => row.note },
                    ]}
                    data={audiences}
                    getRowId={(row) => row.id}
                    density="compact"
                    enableSelection={false}
                />
            </div>
        );
    }

    if (view === 'adsets' || view === 'creatives') {
        const rows = campaignRows.map((campaign) => ({
            id: campaign.id,
            name:
                view === 'adsets'
                    ? `${campaign.name} · ensemble`
                    : `${campaign.name} · créa`,
            campaign: campaign.name,
            kind: channelKind(campaign.channel),
            spend: campaign.spend,
        }));

        return (
            <div className="space-y-5">
                <PageHeader
                    title={view === 'adsets' ? 'Ensembles' : 'Publicités'}
                    descriptor="Dérivé des campagnes du jeu septembre 2026"
                />
                <DataGrid
                    columns={[
                        { id: 'name', header: view === 'adsets' ? 'Ensemble' : 'Publicité', accessorFn: (row) => row.name },
                        {
                            id: 'campaign',
                            header: 'Campagne',
                            accessorFn: (row) => row.campaign,
                            cell: ({ row }) => (
                                <LabLink
                                    to={{ name: 'campaign', id: row.original.id }}
                                    className="text-[var(--evo-teal)] hover:underline"
                                >
                                    {row.original.campaign}
                                </LabLink>
                            ),
                        },
                        { id: 'kind', header: 'Type', accessorFn: (row) => row.kind },
                        {
                            id: 'spend',
                            header: 'Dépensé',
                            accessorFn: (row) => row.spend,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatDa(row.original.spend)}</span>
                            ),
                        },
                    ]}
                    data={rows}
                    getRowId={(row) => row.id}
                    density="compact"
                    enableSelection={false}
                />
            </div>
        );
    }

    if (view === 'attribution') {
        return (
            <div className="space-y-5">
                <PageHeader
                    title="Attribution"
                    descriptor="Même Sankey que Rapports · septembre 2026"
                    context={
                        <>
                            <ContextChip active>Compte Meta EO</ContextChip>
                            <ContextChip>1–30 sept. 2026</ContextChip>
                        </>
                    }
                />
                <CrmKpiStrip
                    columns={5}
                    kpis={[
                        { key: 'spend', label: 'Dépensé', value: formatDa(ads.spend) },
                        { key: 'leads', label: 'Leads Inbox', value: formatCount(ads.leadsInbox) },
                        { key: 'deals', label: 'Affaires', value: formatCount(ads.deals) },
                        { key: 'pipeline', label: 'Pipeline attribué', value: formatDa(ads.attributedRevenue) },
                        {
                            key: 'roas',
                            label: 'Valeur / dépenses',
                            value: formatRoas(ads.displayedRoas),
                            hint: `exact ${formatExactRoas(ads.exactRoas)}`,
                        },
                    ]}
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Flux campagnes → pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartFrame height={380} loading={loading} label="Attribution">
                            <SankeyChart data={flow} height={380} formatValue={formatDa} />
                        </ChartFrame>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === 'campaigns') {
        return (
            <div className="space-y-5">
                <PageHeader
                    title="Campagnes"
                    descriptor="Meta · septembre 2026"
                    context={<ContextChip active>Compte Meta EO</ContextChip>}
                />
                <AdsListToolbar
                    search={search}
                    onSearchChange={setSearch}
                    view={listView}
                    onViewChange={setListView}
                    views={[
                        { id: 'all', name: 'Toutes' },
                        { id: 'active', name: 'Actives' },
                        { id: 'paused', name: 'En pause' },
                    ]}
                />
                <DataGrid
                    columns={[
                        {
                            id: 'name',
                            header: 'Campagne',
                            accessorFn: (row) => row.name,
                            cell: ({ row }) => (
                                <LabLink
                                    to={{ name: 'campaign', id: row.original.id }}
                                    className="font-medium text-[var(--evo-teal)] hover:underline"
                                >
                                    {row.original.name}
                                </LabLink>
                            ),
                        },
                        {
                            id: 'kind',
                            header: 'Type',
                            accessorFn: (row) => channelKind(row.channel),
                        },
                        {
                            id: 'spend',
                            header: 'Dépensé',
                            accessorFn: (row) => row.spend,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatDa(row.original.spend)}</span>
                            ),
                        },
                        {
                            id: 'leads',
                            header: 'Leads',
                            accessorFn: (row) => row.leads,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatCount(row.original.leads)}</span>
                            ),
                        },
                        {
                            id: 'deals',
                            header: 'Affaires',
                            accessorFn: (row) => row.deals,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatCount(row.original.deals)}</span>
                            ),
                        },
                        {
                            id: 'roas',
                            header: 'Valeur / dép.',
                            accessorFn: (row) => row.roas,
                            cell: ({ row }) => (
                                <span className="tabular-nums">{formatRoas(row.original.roas)}</span>
                            ),
                        },
                    ]}
                    data={filteredCampaigns}
                    getRowId={(row) => row.id}
                    density="compact"
                    enableSelection={false}
                    emptyTitle="Aucune campagne"
                />
            </div>
        );
    }

    const journey = [
        { id: 'impressions', label: 'Impressions', value: funnel[0]?.value ?? 0 },
        { id: 'clicks', label: 'Clics', value: funnel[1]?.value ?? 0 },
        { id: 'leads', label: 'Leads Inbox', value: funnel[2]?.value ?? 0 },
        { id: 'deals', label: 'Affaires', value: funnel[3]?.value ?? 0 },
        { id: 'won', label: 'Gagnés (période)', value: funnel[4]?.value ?? won },
    ];

    return (
        <div className="space-y-7">
            <PageHeader
                title="Pubs"
                descriptor="Vue d’ensemble · Meta · septembre 2026"
                context={
                    <>
                        <ContextChip active>Compte Meta EO</ContextChip>
                        <ContextChip>1–30 sept. 2026</ContextChip>
                    </>
                }
            />

            <CrmKpiStrip
                columns={5}
                kpis={[
                    { key: 'spend', label: 'Dépensé', value: formatDa(ads.spend) },
                    {
                        key: 'leads',
                        label: 'Leads Inbox',
                        value: formatCount(ads.leadsInbox),
                        hint: `CPL ${formatDa(cpl)}`,
                    },
                    { key: 'deals', label: 'Affaires créées', value: formatCount(ads.deals) },
                    {
                        key: 'pipeline',
                        label: 'Pipeline attribué',
                        value: formatDa(ads.attributedRevenue),
                    },
                    {
                        key: 'roas',
                        label: 'Valeur / dépenses',
                        value: formatRoas(ads.displayedRoas),
                        hint: `${formatDa(ads.attributedRevenue)} / ${formatDa(ads.spend)} · exact ${formatExactRoas(ads.exactRoas)}`,
                    },
                ]}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle>Dépenses & leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartFrame height={280} loading={loading} label="Dépenses et leads">
                            <ComposedChart
                                data={daily}
                                xKey="label"
                                height={280}
                                yTickFormatter={(value) => formatCompactAxis(value)}
                                rightYTickFormatter={(value) => formatCount(value)}
                                series={[
                                    { type: 'bar', dataKey: 'spend', name: 'Dépensé', yAxisId: 'left' },
                                    { type: 'line', dataKey: 'leads', name: 'Leads', yAxisId: 'right' },
                                ]}
                            />
                        </ChartFrame>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Parcours pubs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FunnelChart steps={journey} />
                        <p className="mt-3 text-[11px] text-[var(--evo-ink-muted)]">
                            {won} gagnées sur la période — total compte, pas nécessairement attribuable aux pubs.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance campagnes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <AdsListToolbar
                        search={search}
                        onSearchChange={setSearch}
                        view={listView}
                        onViewChange={setListView}
                        views={[
                            { id: 'all', name: 'Toutes' },
                            { id: 'active', name: 'Actives' },
                            { id: 'paused', name: 'En pause' },
                        ]}
                    />
                    <DataGrid
                        columns={[
                            {
                                id: 'name',
                                header: 'Campagne',
                                accessorFn: (row) => row.name,
                                cell: ({ row }) => (
                                    <LabLink
                                        to={{ name: 'campaign', id: row.original.id }}
                                        className="font-medium text-[var(--evo-teal)] hover:underline"
                                    >
                                        {row.original.name}
                                    </LabLink>
                                ),
                            },
                            {
                                id: 'spend',
                                header: 'Dépensé',
                                accessorFn: (row) => row.spend,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatDa(row.original.spend)}</span>
                                ),
                            },
                            {
                                id: 'leads',
                                header: 'Leads',
                                accessorFn: (row) => row.leads,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatCount(row.original.leads)}</span>
                                ),
                            },
                            {
                                id: 'deals',
                                header: 'Affaires',
                                accessorFn: (row) => row.deals,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatCount(row.original.deals)}</span>
                                ),
                            },
                            {
                                id: 'attributed',
                                header: 'Attribué',
                                accessorFn: (row) => row.attributedRevenue,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatDa(row.original.attributedRevenue)}</span>
                                ),
                            },
                            {
                                id: 'roas',
                                header: 'Valeur / dép.',
                                accessorFn: (row) => row.roas,
                                cell: ({ row }) => (
                                    <span className="tabular-nums">{formatRoas(row.original.roas)}</span>
                                ),
                            },
                        ]}
                        data={filteredCampaigns}
                        getRowId={(row) => row.id}
                        density="compact"
                        enableSelection={false}
                    />
                    <p className="text-[12px] text-[var(--evo-ink-secondary)]">
                        Total {formatDa(ads.spend)} · {formatCount(ads.leadsInbox)} leads ·{' '}
                        {formatExactRoas(exactRoas(ads.attributedRevenue, ads.spend))}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
