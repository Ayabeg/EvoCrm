/**
 * Registry: ReUI — data-grid-i18n
 * Source: https://reui.io/components/data-grid
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: all strings French; no English library defaults.
 */

export const dataGridFr = {
    selectAll: 'Tout sélectionner',
    selectRow: 'Sélectionner la ligne',
    sortAsc: 'Trier croissant',
    sortDesc: 'Trier décroissant',
    clearSort: 'Annuler le tri',
    columns: 'Colonnes',
    showColumns: 'Afficher les colonnes',
    hideColumn: 'Masquer la colonne',
    pinLeft: 'Épingler à gauche',
    pinRight: 'Épingler à droite',
    unpin: 'Désépingler',
    resize: 'Redimensionner la colonne',
    rowsSelected: ':count sélectionné(s)',
    page: 'Page',
    of: 'sur',
    rowsPerPage: 'Lignes par page',
    first: 'Première page',
    previous: 'Page précédente',
    next: 'Page suivante',
    last: 'Dernière page',
    noResults: 'Aucun résultat',
    loading: 'Chargement du tableau…',
    error: 'Impossible de charger le tableau',
    retry: 'Réessayer',
    bulk: 'Actions groupées',
    clearSelection: 'Effacer la sélection',
    rowActions: 'Actions de la ligne',
} as const;

export type DataGridI18n = typeof dataGridFr;
