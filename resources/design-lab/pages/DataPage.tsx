import { useEffect, useMemo, useState } from 'react';
import {
    BACKEND_FILTER_DEPTH,
    LIST_PAGES_EXECUTE_FILTER_GROUPS,
    shouldOfferFilterGroups,
} from '@/evo/data/adapters/backend-capabilities';
import type { ListPageResource } from '@/evo/data/adapters/backend-capabilities';
import { flattenToWorkspaceFilters, workspaceFiltersToTree } from '@/evo/data/adapters/filter-adapter';
import { DataGrid, DataGridRowAction  } from '@/evo/data/data-grid';
import type {EvoDataGridColumn} from '@/evo/data/data-grid';
import { FilterBar, FilterBuilder } from '@/evo/data/filters';
import { SavedViews } from '@/evo/data/saved-views';
import { formatMoney } from '@/evo/lib/format';
import { Button } from '@/evo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/evo/ui/card';
import { NativeSelect } from '@/evo/ui/native-select';
import type { ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';
import type { Contact, LeadSource } from '../data/evocrm-demo-data';
import { companies, contacts, deals } from '../data/seed';
import {
    SOURCE_LABELS,
    getCompany,
    getOpenDealCount,
    getOwner,
    getTotalOpenPipeline,
    getWonRevenue,
} from '../data/selectors';

const FIELDS: ListFieldDef[] = [
    { id: 'city', label: 'Ville', type: 'text' },
    { id: 'source', label: 'Source', type: 'select', options: Object.keys(SOURCE_LABELS) },
    { id: 'company', label: 'Société', type: 'text' },
    { id: 'owner', label: 'Propriétaire', type: 'text' },
];

const NAMED_COMPANIES = new Set([
    'company-clinique-el-djazair',
    'company-hopital-ibn-sina',
    'company-cabinet-dr-amrani',
    'company-pharmacie-centrale',
]);

type GridRow = Contact & {
    companyName: string;
    ownerName: string;
    openDeals: number;
};

const VIEWS = [
    { id: 'all', name: 'Tous les contacts' },
    { id: 'alger', name: 'Alger' },
    { id: 'clinique', name: 'Clinique El Djazair' },
];

function applyFilters(rows: GridRow[], filters: ListViewFilters, search: string): GridRow[] {
    const needle = search.trim().toLowerCase();
    const searched = needle
        ? rows.filter((row) =>
              `${row.firstName} ${row.lastName} ${row.email} ${row.companyName}`
                  .toLowerCase()
                  .includes(needle),
          )
        : rows;

    const groups = filters.groups.filter((group) => group.rules.length > 0);

    if (groups.length === 0) {
        return searched;
    }

    const groupLogic = filters.logic === 'or' ? 'or' : 'and';

    return searched.filter((row) => {
        const results = groups.map((group) => {
            const checks = group.rules.map((rule) => matchRule(row, rule.field, rule.operator, rule.value));

            return group.logic === 'or' ? checks.some(Boolean) : checks.every(Boolean);
        });

        return groupLogic === 'or' ? results.some(Boolean) : results.every(Boolean);
    });
}

function matchRule(
    row: GridRow,
    field: string,
    operator: string,
    value: string | number | boolean | null | undefined,
): boolean {
    const actual =
        field === 'city'
            ? row.city
            : field === 'source'
              ? row.source
              : field === 'company'
                ? row.companyName
                : field === 'owner'
                  ? row.ownerName
                  : '';
    const expected = value == null ? '' : String(value);

    if (operator === 'eq') {
        return String(actual).toLowerCase() === expected.toLowerCase();
    }

    if (operator === 'contains') {
        return String(actual).toLowerCase().includes(expected.toLowerCase());
    }

    if (operator === 'neq') {
        return String(actual).toLowerCase() !== expected.toLowerCase();
    }

    return true;
}

function chipsFromFilters(filters: ListViewFilters): { id: string; label: string; onRemove: () => void }[] {
    return filters.groups.flatMap((group, groupIndex) =>
        group.rules.map((rule, ruleIndex) => ({
            id: `${groupIndex}-${ruleIndex}-${rule.field}`,
            label: `${FIELDS.find((field) => field.id === rule.field)?.label ?? rule.field} ${rule.operator} ${rule.value ?? ''}`,
            onRemove: () => undefined,
        })),
    );
}

function readSearchParam(name: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return new URLSearchParams(window.location.search).get(name);
}

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

export function DataPage() {
    const requestedState = readSearchParam('state');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<ListViewFilters>(defaultFilterGroups());
    const [builderOpen, setBuilderOpen] = useState(readSearchParam('builder') !== '0');
    const [viewId, setViewId] = useState<string | number>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>(() =>
        readSearchParam('select') === '1' ? contacts.slice(0, 2).map((contact) => contact.id) : [],
    );
    const [gridState, setGridState] = useState<'ready' | 'loading' | 'empty' | 'error'>(
        requestedState === 'loading' || requestedState === 'empty' || requestedState === 'error'
            ? requestedState
            : 'ready',
    );
    const [theme] = useState<'light' | 'dark'>(readSearchParam('theme') === 'dark' ? 'dark' : 'light');
    const [listResource, setListResource] = useState<ListPageResource>(
        readSearchParam('resource') === 'company' ? 'company' : 'contact',
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const rows = useMemo<GridRow[]>(() => {
        return contacts.map((contact) => {
            const company = getCompany(contact.companyId);
            const owner = getOwner(contact.ownerId);
            const openDeals = deals.filter(
                (deal) => deal.contactId === contact.id && deal.status === 'open',
            ).length;

            return {
                ...contact,
                companyName: company.name,
                ownerName: owner.name,
                openDeals,
            };
        });
    }, []);

    const visible = useMemo(() => applyFilters(rows, filters, search), [filters, rows, search]);
    const namedCompanyCount = companies.filter((company) => NAMED_COMPANIES.has(company.id)).length;
    const pipeline = getTotalOpenPipeline();
    const openCount = getOpenDealCount();
    const won = getWonRevenue();

    const columns = useMemo<EvoDataGridColumn<GridRow>[]>(
        () => [
            {
                id: 'name',
                accessorFn: (row) => `${row.firstName} ${row.lastName}`,
                header: 'Contact',
                cell: ({ row }) => (
                    <div>
                        <p className="font-medium">
                            {row.original.firstName} {row.original.lastName}
                        </p>
                        <p className="text-[11px] text-[var(--evo-ink-muted)]">{row.original.title}</p>
                    </div>
                ),
            },
            {
                id: 'company',
                accessorKey: 'companyName',
                header: 'Société',
            },
            {
                id: 'city',
                accessorKey: 'city',
                header: 'Ville',
            },
            {
                id: 'source',
                accessorKey: 'source',
                header: 'Source',
                cell: ({ getValue }) => SOURCE_LABELS[getValue() as LeadSource],
            },
            {
                id: 'owner',
                accessorKey: 'ownerName',
                header: 'Propriétaire',
            },
            {
                id: 'openDeals',
                accessorKey: 'openDeals',
                header: 'Affaires ouvertes',
            },
        ],
        [],
    );

    const applyView = (id: string | number) => {
        setViewId(id);

        if (id === 'alger') {
            setFilters({
                logic: 'and',
                groups: [{ logic: 'and', rules: [{ field: 'city', operator: 'eq', value: 'Alger' }] }],
            });

            return;
        }

        if (id === 'clinique') {
            setFilters({
                logic: 'and',
                groups: [
                    {
                        logic: 'and',
                        rules: [{ field: 'company', operator: 'contains', value: 'Clinique El Djazair' }],
                    },
                ],
            });

            return;
        }

        setFilters(defaultFilterGroups());
    };

    const removeChip = (chipId: string) => {
        const [groupIndex, ruleIndex] = chipId.split('-').map(Number);
        setFilters((current) => ({
            ...current,
            groups: current.groups.map((group, index) =>
                index === groupIndex
                    ? { ...group, rules: group.rules.filter((_, rule) => rule !== ruleIndex) }
                    : group,
            ),
        }));
    };

    const chips = chipsFromFilters(filters).map((chip) => ({
        ...chip,
        onRemove: () => removeChip(chip.id),
    }));

    return (
        <div className="mx-auto max-w-[1200px] pb-16" data-lab="data">
            <header className="border-b border-[var(--evo-hairline)] pb-5">
                <p className="text-[12px] text-[var(--evo-ink-muted)]">Système de design · PR3</p>
                <h1 className="mt-1 text-[length:var(--evo-text-24)] leading-none font-semibold tracking-[-0.03em]">
                    Données
                </h1>
                <p className="mt-2 max-w-[48rem] text-[13px] text-[var(--evo-ink-muted)]">
                    Un DataGrid, des filtres à deux niveaux et des vues enregistrées sur le jeu
                    démo (Clinique El Djazair, Hôpital Ibn Sina, Cabinet Dr. Amrani, Pharmacie
                    Centrale). Totaux dérivés — aucun chiffre en dur. Les pages liste production
                    restent sur PR4.
                </p>
            </header>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[12px] font-medium text-[var(--evo-ink-muted)]">
                            Contacts visibles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[20px] font-semibold">{visible.length}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[12px] font-medium text-[var(--evo-ink-muted)]">
                            Sociétés nommées
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[20px] font-semibold">{namedCompanyCount}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[12px] font-medium text-[var(--evo-ink-muted)]">
                            Pipeline ouvert
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[20px] font-semibold">
                        {formatMoney(pipeline)}
                        <span className="ml-2 text-[12px] font-normal text-[var(--evo-ink-muted)]">
                            {openCount} affaires
                        </span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[12px] font-medium text-[var(--evo-ink-muted)]">
                            Gagné (dérivé)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[20px] font-semibold">{formatMoney(won)}</CardContent>
                </Card>
            </div>

            <div className="mt-6 flex flex-col gap-3">
                <SavedViews
                    views={VIEWS}
                    activeViewId={viewId}
                    onViewChange={applyView}
                    onSave={() => undefined}
                />
                <FilterBar
                    search={search}
                    onSearchChange={setSearch}
                    chips={chips}
                    onAdvanced={() => setBuilderOpen((open) => !open)}
                    onClear={() => {
                        setFilters(defaultFilterGroups());
                        setSearch('');
                    }}
                    extra={
                        <div className="flex gap-1">
                            {(['ready', 'loading', 'empty', 'error'] as const).map((state) => (
                                <Button
                                    key={state}
                                    size="sm"
                                    variant={gridState === state ? 'secondary' : 'ghost'}
                                    onClick={() => setGridState(state)}
                                >
                                    {state === 'ready'
                                        ? 'Prêt'
                                        : state === 'loading'
                                          ? 'Chargement'
                                          : state === 'empty'
                                            ? 'Vide'
                                            : 'Erreur'}
                                </Button>
                            ))}
                        </div>
                    }
                />
                {builderOpen ? (
                    <Card data-lab="filter-builder">
                        <CardHeader>
                            <CardTitle>Constructeur de filtres</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-3 flex items-center gap-2">
                                <label className="text-[12px] text-[var(--evo-ink-muted)]" htmlFor="lab-filter-resource">
                                    Index simulé
                                </label>
                                <NativeSelect
                                    id="lab-filter-resource"
                                    className="w-40"
                                    value={listResource}
                                    onChange={(event) =>
                                        setListResource(event.target.value as ListPageResource)
                                    }
                                >
                                    <option value="contact">Contacts</option>
                                    <option value="company">Sociétés</option>
                                    <option value="deal">Affaires</option>
                                </NativeSelect>
                            </div>
                            <FilterBuilder
                                value={filters}
                                fields={FIELDS}
                                onChange={setFilters}
                                resource={listResource}
                            />
                            <p className="mt-3 text-[11px] text-[var(--evo-ink-muted)]">
                                Backend : profondeur {BACKEND_FILTER_DEPTH}. L’adaptateur propose
                                les groupes seulement si le backend les exécute ({listResource} →{' '}
                                {shouldOfferFilterGroups(listResource) ? 'oui' : 'non'}). Contact /
                                affaire / ticket / devis / piste :{' '}
                                {LIST_PAGES_EXECUTE_FILTER_GROUPS.contact ? 'oui' : 'non'}. PR4
                                câblera CrmFilter::apply() sur ces index. Arbres imbriqués aplatis
                                ({workspaceFiltersToTree(filters).kind} →{' '}
                                {
                                    flattenToWorkspaceFilters(workspaceFiltersToTree(filters), {
                                        resource: listResource,
                                    }).groups.length
                                }{' '}
                                groupe(s)).
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                {selectedIds.length > 0 ? (
                    <div
                        className="flex items-center justify-between rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-teal-soft)] px-3 py-2"
                        data-lab="bulk-bar"
                        role="status"
                    >
                        <p className="text-[13px]">
                            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                                Assigner
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                                Effacer
                            </Button>
                        </div>
                    </div>
                ) : null}

                <DataGrid
                    columns={columns}
                    data={gridState === 'empty' ? [] : visible}
                    getRowId={(row) => row.id}
                    density="standard"
                    state={gridState === 'empty' ? 'empty' : gridState}
                    selectedIds={selectedIds}
                    onSelectedIdsChange={setSelectedIds}
                    emptyTitle="Aucun contact"
                    emptyDescription="Aucun enregistrement ne correspond aux filtres."
                    errorMessage="Impossible de charger le jeu démo."
                    onRetry={() => setGridState('ready')}
                    rowActions={() => <DataGridRowAction>Ouvrir</DataGridRowAction>}
                    bulkActions={
                        selectedIds.length > 0 ? (
                            <span className="text-[12px]">{selectedIds.length} lignes</span>
                        ) : null
                    }
                />
            </div>
        </div>
    );
}
