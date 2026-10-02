import { describe, expect, it } from 'vitest';
import { frenchPipelineAnnouncements } from '@/evo/crm/pipeline/announcements';

describe('french pipeline announcements', () => {
    const items = [
        {
            id: 'deal:7',
            name: 'Équipement bloc opératoire',
            column: 'Proposition',
        },
    ];
    const columns = [{ id: 'column:3', name: 'Proposition' }];

    it('announces pickup, hover, drop and cancel in French keys', () => {
        const announcements = frenchPipelineAnnouncements(items, columns);

        expect(
            announcements.onDragStart({ active: { id: 'deal:7' } }),
        ).toContain('Équipement bloc opératoire');
        expect(
            announcements.onDragOver({
                active: { id: 'deal:7' },
                over: { id: 'column:3' },
            }),
        ).toContain('Proposition');
        expect(
            announcements.onDragEnd({
                active: { id: 'deal:7' },
                over: { id: 'column:3' },
            }),
        ).toContain('Proposition');
        expect(
            announcements.onDragCancel({ active: { id: 'deal:7' } }),
        ).toContain('Équipement bloc opératoire');
    });
});
