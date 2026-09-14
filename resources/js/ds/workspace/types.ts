import type { ReactNode } from 'react';
import type {
    ListColumnDef,
    ListFieldDef,
    ListObjectType,
    ListViewColumn,
    ListViewFilters,
    SavedView,
} from '@/lib/list-view-config';

export type DataWorkspaceObject = 'contact' | 'company' | 'deal' | 'quote';

export type DataWorkspaceEntity = DataWorkspaceObject | Extract<ListObjectType, 'ticket'>;

export type DataWorkspaceChip = {
    id: string;
    label: string;
    onRemove: () => void;
};

export type DataWorkspaceEmpty = {
    title: string;
    body: string;
    actionLabel?: string;
};

export type DataWorkspacePaginator = {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
};

export type DataWorkspaceFilterContext = {
    members?: Array<{ id: number; name: string }>;
    cities?: string[];
    wilayas?: string[];
    stages?: Array<{ id: number; name: string; slug: string }>;
};

export type DataWorkspaceRenderResults = ReactNode | ((columns: ListViewColumn[]) => ReactNode);

/**
 * Chrome DataWorkspace owns in both result modes.
 * Domain still supplies copy, filter fields, column defs, and create.
 */
export type DataWorkspaceChromeProps = {
    object: DataWorkspaceEntity;
    title: string;
    description?: string;
    primaryAction: { label: string; onClick: () => void };

    views: SavedView[];
    activeViewId?: string;
    onViewChange: (id: string | null) => void;
    onViewSave?: (input: {
        name: string;
        filters: ListViewFilters;
        columns: ListViewColumn[];
    }) => void;

    filters: ListViewFilters | Record<string, unknown>;
    onFiltersChange: (next: ListViewFilters) => void;
    filterFields: ListFieldDef[];
    chips?: DataWorkspaceChip[];

    columns: ListViewColumn[];
    columnDefs: ListColumnDef[];
    onColumnsChange: (columns: ListViewColumn[]) => void;
    sort?: { id: string; dir: 'asc' | 'desc' };

    bulk?: ReactNode;

    mode?: 'list' | 'board';
    onModeChange?: (mode: 'list' | 'board') => void;
    board?: ReactNode;

    extraQuery?: Record<string, string | number | null | undefined>;
    basePath: string;

    filterContext?: DataWorkspaceFilterContext;
    secondaryActions?: ReactNode;
    banner?: ReactNode;
    filterExtra?: ReactNode;
    toolbarExtra?: ReactNode;
    className?: string;
    contentClassName?: string;
};

/**
 * MODE A — DataWorkspace / DataTable owns rows and shared table chrome.
 * Selection stays optional until P03B; do not invent page selection here.
 */
export type DataWorkspaceSharedTableProps<Row extends { id: number } = { id: number }> =
    DataWorkspaceChromeProps & {
        resultMode: 'shared-table';
        rows: Row[];
        rowHref: (row: Row) => string;
        onRowPeek?: (row: Row) => void;
        selectable?: boolean;
        selectedIds?: number[];
        onSelectedIdsChange?: (ids: number[]) => void;
        loading?: boolean;
        empty: DataWorkspaceEmpty;
        paginator?: DataWorkspacePaginator;
        renderResults?: never;
        children?: never;
    };

/**
 * MODE B — Domain renders the result surface (table, empty, pagination, selection).
 * DataWorkspace owns surrounding list chrome only. No sentinel rows.
 */
export type DataWorkspaceDomainProps = DataWorkspaceChromeProps & {
    resultMode: 'domain';
    renderResults: DataWorkspaceRenderResults;
    rows?: never;
    rowHref?: never;
    onRowPeek?: never;
    selectable?: never;
    selectedIds?: never;
    onSelectedIdsChange?: never;
    loading?: never;
    empty?: never;
    paginator?: never;
    children?: never;
};

export type DataWorkspaceProps<Row extends { id: number } = { id: number }> =
    | DataWorkspaceSharedTableProps<Row>
    | DataWorkspaceDomainProps;

export type DataTableColumn<Row> = {
    id: string;
    label: string;
    width?: number;
    render: (row: Row) => ReactNode;
};

export type DataTableProps<Row extends { id: number } = { id: number }> = {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowHeight?: 48;
    selectedIds?: number[];
    onToggle?: (id: number) => void;
    onRowClick?: (row: Row) => void;
};

export type BulkAction = 'assign_owner' | 'enroll_sequence' | 'move_stage' | 'delete' | 'export';

export type BulkActionBarProps = {
    object: DataWorkspaceEntity;
    selectedIds: number[];
    actions: BulkAction[];
    members?: Array<{ id: number; name: string }>;
    sequences?: Array<{ id: number; name: string }>;
    stages?: Array<{ id: number; name: string }>;
    onClear: () => void;
};
