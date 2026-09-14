import type { ReactNode } from 'react';
import { listPageHref } from '@/components/crm/list-query';
import type { RowId } from '@/ds/workspace/selection';

/**
 * Shared-table row link. `rowHref` is the workspace contract (P03D).
 * Domain ListViewTable pages that omit it keep `${basePath}/${id}`.
 */
export function resolveRowHref<Row extends { id: RowId }>(
    row: Row,
    rowHref: ((row: Row) => string) | undefined,
    basePath: string,
): string {
    if (rowHref) {
        return rowHref(row);
    }

    return `${basePath.replace(/\/$/, '')}/${row.id}`;
}

/**
 * Shared-table paginator href. Same writer as domain `CrmListFooter`
 * (`listPageHref` → canonical query). Page ≤ 1 is omitted; siblings survive.
 */
export function workspacePageHref(
    basePath: string,
    filters: Record<string, unknown>,
    page: number,
    extraQuery: Record<string, string | number | null | undefined> = {},
): string {
    return listPageHref(basePath, filters, page, extraQuery);
}

/**
 * Board slot for P11. Returns the provided board when `mode="board"`.
 * Does not render PipelineKanban, change deal routes, or invent filters.
 */
export function resolveWorkspaceBoardSlot(input: {
    mode?: 'list' | 'board';
    board?: ReactNode;
}): ReactNode | null {
    if (input.mode === 'board' && input.board) {
        return input.board;
    }

    return null;
}
