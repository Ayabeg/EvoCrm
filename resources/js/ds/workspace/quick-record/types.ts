export const RECORD_TYPES = ['contact', 'company', 'lead', 'deal', 'quote'] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export type RecordRef = {
    type: RecordType;
    id: number;
};

export type RecordStatusTone = 'neutral' | 'success' | 'warning' | 'danger';

export type RecordStatus = {
    label: string;
    tone?: RecordStatusTone;
};

export type RecordOwner = {
    id: number;
    name: string;
};

export type KeyProperty = {
    id: string;
    label: string;
    value: string | null;
    href?: string;
};

export type RecordAssociation = {
    ref: RecordRef;
    label: string;
    hint?: string;
};

export type RecordActionId = 'email' | 'call' | 'open_full';

export type RecordAction = {
    id: RecordActionId;
    label: string;
    href: string;
};

export type RecordCapabilities = {
    overview: boolean;
    activity: boolean;
    notes: boolean;
    tasks: boolean;
    associations: boolean;
    actions: boolean;
};

export type RecordActivityItem = {
    id: number;
    type: string;
    title: string;
    body?: string | null;
    at?: string | null;
    owner?: string | null;
    done?: boolean;
};

export type RecordPermissions = {
    can_view: boolean;
    can_update: boolean;
};

export type RecordDescriptor = {
    ref: RecordRef;
    title: string;
    subtitle?: string;
    avatar?: { initials: string };
    status?: RecordStatus;
    owner?: RecordOwner;
    fullRecordHref: string;
    keyProperties: KeyProperty[];
    associations: RecordAssociation[];
    activity: RecordActivityItem[];
    notes: RecordActivityItem[];
    tasks: RecordActivityItem[];
    actions: RecordAction[];
    capabilities: RecordCapabilities;
    permissions: RecordPermissions;
};

export type PeekAssociation = {
    type: RecordType;
    id: number;
    label: string;
    hint?: string;
};

export type PeekActivity = {
    id: number;
    type: string;
    subject?: string | null;
    body?: string | null;
    done?: boolean;
    due_at?: string | null;
    created_at?: string | null;
    owner_name?: string | null;
};

export type QuickRecordPeekPayload = {
    type: RecordType;
    id: number;
    record: Record<string, unknown>;
    associations: PeekAssociation[];
    activity: PeekActivity[];
    notes: PeekActivity[];
    tasks: PeekActivity[];
    capabilities: RecordCapabilities;
    permissions: RecordPermissions;
};

export type DrawerErrorCode = 'not_found' | 'forbidden' | 'network' | 'malformed';

export type DrawerError = {
    code: DrawerErrorCode;
    message: string;
    status?: number;
    fullRecordHref?: string;
};

export type DrawerStatus = 'idle' | 'loading' | 'ready' | 'error';
