import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { filtersKeys } from '../filters/i18n';
import { dataGridKeys } from './i18n';

const fr = JSON.parse(
    readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../../lang/fr.json'),
        'utf8',
    ),
) as Record<string, string>;

describe('DataGrid / filter locale keys', () => {
    it('locks chrome to translation keys present in fr.json', () => {
        const gridKeys = Object.values(dataGridKeys);
        const filterKeys = [
            filtersKeys.apply,
            filtersKeys.clear,
            filtersKeys.advanced,
            ...Object.values(filtersKeys.operators),
        ];

        for (const key of [...gridKeys, ...filterKeys]) {
            expect(fr[key as keyof typeof fr]).toBeTruthy();
        }

        expect(fr['No results']).toBe('Aucun résultat');
        expect(fr['Select row']).toBe('Sélectionner la ligne');
        expect(fr.Apply).toBe('Appliquer');
        expect(gridKeys).not.toContain('No results found');
    });
});
