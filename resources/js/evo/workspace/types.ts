import type { ReactNode } from 'react';

export type WorkspaceArchetype =
    | 'workspace'
    | 'record'
    | 'conversation'
    | 'document';

/**
 * Who scrolls. Regional owners never nest a second overflow-y-auto
 * on the acceptance routes.
 */
export type WorkspaceScrollOwner =
    | 'surface'
    | 'pipeline'
    | 'columns'
    | 'conversation'
    | 'document';

export type WorkspaceShellScroll = 'frame' | 'document';

export type WorkspaceHeaderAction = {
    id: string;
    label: ReactNode;
    href?: string;
    onClick?: () => void;
    destructive?: boolean;
    disabled?: boolean;
};

export type WorkspaceViewItem = {
    id: string;
    label: string;
    active?: boolean;
    href?: string;
    onSelect?: () => void;
};

export type WorkspaceHeaderSlots = {
    /** Slot A — leading (back on records, hidden ≥768). */
    leading?: ReactNode;
    /** Slot B — one-level context / breadcrumb. */
    context?: ReactNode;
    /** Slot C — page or record title. Never a greeting. */
    title: ReactNode;
    /** Slot D — count on workspaces, status on records. */
    count?: ReactNode;
    status?: ReactNode;
    /** Slot E — meta; hidden <1024. */
    meta?: ReactNode;
    /** Slot F — ≤2 ghost secondaries. Extra go to overflow. */
    secondaryActions?: ReactNode;
    /** Slot G — overflow / ⋯ */
    overflowActions?: WorkspaceHeaderAction[];
    /** Slot H — 0 or 1 orange primary. */
    primaryAction?: ReactNode;
    /** Slot I — panel toggles. */
    panels?: ReactNode;
    /** Slot J — saved views / view tabs (existing UI, as-is). */
    views?: ReactNode;
    viewItems?: WorkspaceViewItem[];
    /** Slot L — one-line summary. Hidden <1024. */
    summary?: ReactNode;
    /** Slot M — search. */
    search?: ReactNode;
    /** Slots N–P — filter / sort / display (existing UI). */
    filters?: ReactNode;
    /** Slot Q — list/board toggle. */
    layoutToggle?: ReactNode;
    /** Row 3 chips. Hidden when selection is set. */
    chips?: ReactNode;
    /** Row 3 bulk bar. Replaces chips when present. */
    selection?: ReactNode;
};

export type WorkspaceHeaderProps = WorkspaceHeaderSlots & {
    archetype?: WorkspaceArchetype;
    sticky?: boolean;
    className?: string;
    /** Preserved source-lock hooks from the five header adapters. */
    density?: 'workspace' | 'page';
    dataCrm?: string;
    dataDs?: string;
    dataSettings?: string;
};

export type WorkspaceRouteResolution = {
    path: string;
    archetype: WorkspaceArchetype;
    scrollOwner: WorkspaceScrollOwner;
    migrated: boolean;
    shellScroll: WorkspaceShellScroll;
};
