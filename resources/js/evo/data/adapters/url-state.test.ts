import { router } from '@inertiajs/react';
import { describe, expect, it, vi } from 'vitest';

import { emptyCanonicalListQuery } from '@/lib/list-query/empty';

import { replaceListUrl } from './url-state';

vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
    },
}));

describe('list URL state', () => {
    it('uses Inertia router.get with preserveState, preserveScroll, and replace', () => {
        replaceListUrl('/crm/companies', emptyCanonicalListQuery(), 'company');

        expect(router.get).toHaveBeenCalledTimes(1);
        const [, , options] = vi.mocked(router.get).mock.calls[0] ?? [];
        expect(options).toMatchObject({
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    });
});
