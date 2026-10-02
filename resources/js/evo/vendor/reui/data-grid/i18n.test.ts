import { describe, expect, it } from 'vitest';
import { filtersFr } from '../filters/i18n';
import { dataGridFr } from './i18n';

describe('DataGrid / filter French strings', () => {
    it('does not ship English library defaults', () => {
        const grid = Object.values(dataGridFr).join(' ');
        const filterValues = [
            filtersFr.apply,
            filtersFr.clear,
            filtersFr.advanced,
            ...Object.values(filtersFr.operators),
        ].join(' ');

        expect(grid).toContain('Aucun résultat');
        expect(grid).toContain('Sélectionner la ligne');
        expect(grid.toLowerCase()).not.toContain('no results');
        expect(filterValues).toContain('Appliquer');
        expect(filterValues.toLowerCase()).not.toContain('apply');
    });
});
