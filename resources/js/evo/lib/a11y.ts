/** Shared French screen-reader copy for Evo primitives. */
export const sr = {
    close: 'Fermer',
    loading: 'Chargement…',
    required: 'obligatoire',
    selected: 'sélectionné',
    notSelected: 'non sélectionné',
    more: 'Plus',
    previous: 'Précédent',
    next: 'Suivant',
    firstPage: 'Première page',
    lastPage: 'Dernière page',
    openMenu: 'Ouvrir le menu',
    search: 'Rechercher',
    clear: 'Effacer',
    clearSearch: 'Effacer la recherche',
    openCalendar: 'Ouvrir le calendrier',
    chooseDate: 'Choisir une date',
    chooseTime: 'Choisir une heure',
    hour: 'Heure',
    minute: 'Minutes',
    increment: 'Augmenter',
    decrement: 'Diminuer',
    remove: 'Retirer',
    pagination: 'Pagination',
    columns: 'Colonnes',
    rowActions: 'Actions de la ligne',
    selectRow: 'Sélectionner la ligne',
    selectAll: 'Tout sélectionner',
    sortedAsc: 'trié croissant',
    sortedDesc: 'trié décroissant',
    notSorted: 'non trié',
} as const;

export function announce(message: string): void {
    if (typeof document === 'undefined') {
        return;
    }

    const region = document.getElementById('evo-live-region') ?? createLiveRegion();
    region.textContent = '';
    window.setTimeout(() => {
        region.textContent = message;
    }, 20);
}

function createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.id = 'evo-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);

    return region;
}
