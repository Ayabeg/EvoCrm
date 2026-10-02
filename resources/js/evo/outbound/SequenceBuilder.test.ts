import { describe, expect, it } from 'vitest';
import { outboundMessages } from '@/evo/outbound/messages';
import { frenchSortableAnnouncements } from '@/evo/outbound/SequenceBuilder';
import type { SequenceStepRow } from '@/evo/outbound/types';
import { hydrateI18n } from '@/lib/i18n';

hydrateI18n('fr', outboundMessages);

const steps: SequenceStepRow[] = [
    {
        id: 11,
        position: 1,
        delay_hours: 0,
        channel: 'email',
        subject: 'Intro Pharmacie Centrale',
    },
    {
        id: 22,
        position: 2,
        delay_hours: 48,
        channel: 'email',
        subject: 'Relance',
    },
];

describe('frenchSortableAnnouncements', () => {
    it('announces pickup, hover, drop and cancel in French', () => {
        const announcements = frenchSortableAnnouncements(steps);

        expect(announcements.onDragStart({ active: { id: 11 } })).toBe(
            'Étape 1 saisie, Intro Pharmacie Centrale',
        );
        expect(announcements.onDragOver({ active: { id: 11 }, over: { id: 22 } })).toBe(
            'L’étape Intro Pharmacie Centrale est au-dessus de la position 2',
        );
        expect(announcements.onDragEnd({ active: { id: 11 }, over: { id: 22 } })).toBe(
            'Étape Intro Pharmacie Centrale déposée à la position 2',
        );
        expect(announcements.onDragCancel({ active: { id: 11 } })).toBe(
            'Réordonnancement annulé pour l’étape Intro Pharmacie Centrale',
        );
    });
});
