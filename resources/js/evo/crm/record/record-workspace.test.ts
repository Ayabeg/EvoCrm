import { describe, expect, it } from 'vitest';
import type { QuickRecordPeekPayload } from '@/ds/workspace/quick-record/types';
import { adaptRecord } from '@/ds/workspace/record-adapters';

const capabilities = {
    overview: true,
    activity: true,
    notes: true,
    tasks: true,
    associations: true,
    actions: true,
};

const permissions = { can_view: true, can_update: true };

describe('record adapters including ticket', () => {
    it('adapts a ticket peek payload', () => {
        const payload: QuickRecordPeekPayload = {
            type: 'ticket',
            id: 12,
            record: {
                subject: 'Scialytique en panne',
                number: 'T-1042',
                status: 'waiting_on_us',
                priority: 'high',
                company_name: 'Clinique El Djazair',
                contact_name: 'Amine Benali',
                owner_name: 'Sofia Kaci',
                owner_id: 3,
            },
            associations: [
                { type: 'company', id: 1, label: 'Clinique El Djazair' },
                { type: 'contact', id: 2, label: 'Amine Benali' },
            ],
            activity: [],
            notes: [],
            tasks: [],
            capabilities,
            permissions,
        };

        const descriptor = adaptRecord(payload);

        expect(descriptor.ref).toEqual({ type: 'ticket', id: 12 });
        expect(descriptor.title).toBe('Scialytique en panne');
        expect(descriptor.subtitle).toBe('T-1042');
        expect(descriptor.fullRecordHref).toBe('/crm/tickets/12');
        expect(
            descriptor.keyProperties.some((row) => row.id === 'priority'),
        ).toBe(true);
    });

    it('adapts the Clinique deal for the record workspace', () => {
        const payload: QuickRecordPeekPayload = {
            type: 'deal',
            id: 7,
            record: {
                title: 'Équipement bloc opératoire',
                company_name: 'Clinique El Djazair',
                amount_cents: 128_000_000,
                currency: 'DZD',
                stage_name: 'Proposition',
            },
            associations: [
                { type: 'company', id: 1, label: 'Clinique El Djazair' },
            ],
            activity: [],
            notes: [],
            tasks: [],
            capabilities,
            permissions,
        };

        const descriptor = adaptRecord(payload);

        expect(descriptor.title).toBe('Équipement bloc opératoire');
        expect(descriptor.subtitle).toBe('Clinique El Djazair');
        expect(
            descriptor.keyProperties.find((row) => row.id === 'amount')?.value,
        ).toMatch(/1\s?280\s?000/);
    });
});
