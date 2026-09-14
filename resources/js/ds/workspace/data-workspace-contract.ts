import type { DataWorkspaceChromeProps, DataWorkspaceProps } from '@/ds/workspace/types';

/**
 * Compile-time ownership lock for P03A.
 * `@ts-expect-error` cases fail types:check if the union becomes lax.
 */

const chrome: DataWorkspaceChromeProps = {
    object: 'contact',
    title: 'Contacts',
    primaryAction: { label: 'Create contact', onClick: () => undefined },
    views: [],
    onViewChange: () => undefined,
    filters: {},
    onFiltersChange: () => undefined,
    filterFields: [],
    columns: [],
    columnDefs: [],
    onColumnsChange: () => undefined,
    basePath: '/crm/contacts',
};

declare function acceptWorkspace(props: DataWorkspaceProps): void;

acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
    renderResults: null,
});

acceptWorkspace({
    ...chrome,
    resultMode: 'shared-table',
    rows: [{ id: 1 }],
    rowHref: (row) => `/crm/contacts/${row.id}`,
    empty: { title: 'No contacts yet', body: '' },
});

// @ts-expect-error domain mode cannot accept fake rows
acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
    renderResults: null,
    rows: [],
});

// @ts-expect-error shared-table cannot also mount a domain result surface
acceptWorkspace({
    ...chrome,
    resultMode: 'shared-table',
    rows: [{ id: 1 }],
    rowHref: (row) => `/crm/contacts/${row.id}`,
    empty: { title: 'No contacts yet', body: '' },
    renderResults: null,
});

// @ts-expect-error domain mode cannot omit renderResults
acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
});

// @ts-expect-error shared-table cannot omit rows
acceptWorkspace({
    ...chrome,
    resultMode: 'shared-table',
    rowHref: (row) => `/crm/contacts/${row.id}`,
    empty: { title: 'No contacts yet', body: '' },
});

acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
    renderResults: ({ selection }) => selection.selectedCount,
    selection: {
        mode: 'uncontrolled',
        pageIds: [1, 'uuid-row'],
        selectable: true,
    },
});

acceptWorkspace({
    ...chrome,
    resultMode: 'shared-table',
    rows: [{ id: 'uuid-1' }],
    rowHref: (row) => `/crm/contacts/${row.id}`,
    empty: { title: 'No contacts yet', body: '' },
    selection: {
        mode: 'controlled',
        selectedIds: ['uuid-1'],
        onSelectedIdsChange: () => undefined,
    },
});

// @ts-expect-error uncontrolled selection cannot pass selectedIds
acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
    renderResults: null,
    selection: {
        mode: 'uncontrolled',
        selectedIds: [1],
        onSelectedIdsChange: () => undefined,
    },
});

// @ts-expect-error controlled selection requires onSelectedIdsChange
acceptWorkspace({
    ...chrome,
    resultMode: 'domain',
    renderResults: null,
    selection: {
        mode: 'controlled',
        selectedIds: [1],
    },
});
