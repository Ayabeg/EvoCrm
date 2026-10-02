/**
 * Registry: ReUI — data-grid-i18n
 * Source: https://reui.io/components/data-grid
 * Upstream: https://github.com/keenthemes/reui @ 6e433ddaba3a4be38182c8c8883b6cc335183c42
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: English keys via t(); no English library defaults left untranslated.
 */

import { t } from '@/lib/i18n';

export const dataGridKeys = {
    selectAll: 'Select all',
    selectRow: 'Select row',
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    clearSort: 'Clear sort',
    columns: 'Columns',
    showColumns: 'Show columns',
    hideColumn: 'Hide column',
    pinLeft: 'Pin to start',
    pinRight: 'Pin to end',
    unpin: 'Unpin',
    resize: 'Resize column',
    rowsSelected: ':count selected',
    page: 'Page',
    of: 'of',
    rowsPerPage: 'Rows per page',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    noResults: 'No results',
    loading: 'Loading table…',
    error: 'Could not load the table',
    retry: 'Retry',
    bulk: 'Bulk actions',
    clearSelection: 'Clear selection',
    rowActions: 'Row actions',
} as const;

export type DataGridI18n = typeof dataGridKeys;

export const dataGridFr: DataGridI18n = new Proxy(dataGridKeys, {
    get(target, property) {
        const key = target[property as keyof typeof target];

        return typeof key === 'string' ? t(key) : key;
    },
}) as DataGridI18n;
