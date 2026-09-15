import type { ReactNode } from 'react';
import type { RowId, WorkspaceSelection, WorkspaceSelectionInput } from '@/ds/workspace/selection';
import type {
    ListColumnDef,
    ListFieldDef,
    ListObjectType,
    ListViewColumn,
    ListViewFilters,
    SavedView,
} from '@/lib/list-view-config';

export type { RowId, WorkspaceSelection, WorkspaceSelectionInput };

export type DataWorkspaceObject = 'contact' | 'company' | 'deal' | 'quote' | 'lead';

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

    /**
     * Chrome bulk slot. A render function is allowed so shared-table pages
     * can read workspace selection without a page-local selectedIds store.
     */
    bulk?: ReactNode | ((selection: WorkspaceSelection) => ReactNode);
    /** Optional CSV export link rendered by WorkspacePaginator. */
    exportHref?: string;

    mode?: 'list' | 'board';
    onModeChange?: (mode: 'list' | 'board') => void;
    /**
     * P11 board slot. Rendered when `mode="board"` in either result mode.
     * Pass `<PipelineKanban />` later — do not move the deals board here (P03D).
     */
    board?: ReactNode;

    extraQuery?: Record<string, string | number | null | undefined>;
    basePath: string;

    /**
     * Shared selection + bulk-state contract (P03B).
     * Domain still owns row identity, page participation (`selectable`),
     * per-row `isRowSelectable`, actions, and handlers.
     * `selectable: false` means this page does not participate now —
     * not that the object can never support bulk.
     */
    selection?: WorkspaceSelectionInput;

    filterContext?: DataWorkspaceFilterContext;
    secondaryActions?: ReactNode;
    banner?: ReactNode;
    filterExtra?: ReactNode;
    toolbarExtra?: ReactNode;
    className?: string;
    contentClassName?: string;
};

export type DataWorkspaceRenderResultsContext<Id extends RowId = RowId> = {
    columns: ListViewColumn[];
    selection: WorkspaceSelection<Id>;
};

export type DataWorkspaceRenderResults =
    | ReactNode
    | ((ctx: DataWorkspaceRenderResultsContext) => ReactNode);

/**
 * MODE A — DataWorkspace / DataTable owns rows and shared table chrome.
 * Selection is the chrome `selection` contract, not a second selectedIds prop.
 */
export type DataWorkspaceSharedTableProps<Row extends { id: RowId } = { id: RowId }> =
    DataWorkspaceChromeProps & {
        resultMode: 'shared-table';
        rows: Row[];
        /** Consumed by ListDataTable (P03D). Not voided. */
        rowHref: (row: Row) => string;
        /** Reserved for P09 QuickRecordDrawer. Not wired in P03D. */
        onRowPeek?: (row: Row) => void;
        loading?: boolean;
        /** WorkspaceEmpty — heading required. Domain pages keep CrmEmptyState. */
        empty: DataWorkspaceEmpty;
        /** WorkspacePaginator via listPageHref. Domain pages keep CrmListFooter. */
        paginator?: DataWorkspacePaginator;
        renderResults?: never;
        children?: never;
    };

/**
 * MODE B — Domain renders the result surface (table, empty, pagination).
 * DataWorkspace owns surrounding list chrome + shared selection state.
 * Domain consumes selection via renderResults({ columns, selection }).
 */
export type DataWorkspaceDomainProps = DataWorkspaceChromeProps & {
    resultMode: 'domain';
    renderResults: DataWorkspaceRenderResults;
    rows?: never;
    rowHref?: never;
    onRowPeek?: never;
    loading?: never;
    empty?: never;
    paginator?: never;
    children?: never;
};

export type DataWorkspaceProps<Row extends { id: RowId } = { id: RowId }> =
    | DataWorkspaceSharedTableProps<Row>
    | DataWorkspaceDomainProps;

export type DataTableColumn<Row> = {
    id: string;
    label: string;
    width?: number;
    render: (row: Row) => ReactNode;
};

export type DataTableProps<Row extends { id: RowId } = { id: RowId }> = {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowHeight?: 48;
    selectedIds?: RowId[];
    onToggle?: (id: RowId) => void;
    onTogglePage?: () => void;
    onRowClick?: (row: Row) => void;
    isRowSelectable?: (id: RowId) => boolean;
};

export type BulkAction = 'assign_owner' | 'enroll_sequence' | 'move_stage' | 'delete' | 'export';

export type BulkActionBarProps = {
    object: DataWorkspaceEntity;
    selectedIds: RowId[];
    actions: BulkAction[];
    members?: Array<{ id: number; name: string }>;
    sequences?: Array<{ id: number; name: string }>;
    stages?: Array<{ id: number; name: string }>;
    onClear: () => void;
};
