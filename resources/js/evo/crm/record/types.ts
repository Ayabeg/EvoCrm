import type {
    RecordDescriptor,
    RecordRef,
    RecordType,
} from '@/ds/workspace/quick-record/types';

export type RecordKind = RecordType;

export type RecordPathStep = {
    id: string;
    label: string;
    current?: boolean;
    complete?: boolean;
    disabled?: boolean;
};

export type RecordProperty = {
    id: string;
    label: string;
    value: string | null;
    href?: string;
    money?: boolean;
};

export type RecordRelatedItem = {
    id: string | number;
    label: string;
    href: string;
    meta?: string | null;
};

export type RecordAssociationItem = {
    ref: RecordRef;
    label: string;
    hint?: string;
    href?: string;
};

export type TimelineItem = {
    id: string | number;
    type: string;
    title: string;
    body?: string | null;
    at?: string | null;
    owner?: string | null;
    done?: boolean;
};

export type NextActionValue = {
    title: string;
    dueAt?: string | null;
    owner?: string | null;
    href?: string;
};

export type CRMContextRecord = Pick<
    RecordDescriptor,
    | 'ref'
    | 'title'
    | 'subtitle'
    | 'status'
    | 'owner'
    | 'fullRecordHref'
    | 'keyProperties'
    | 'associations'
> & {
    nextAction?: NextActionValue | null;
};

export type RecordActionItem = {
    id: string;
    label: string;
    href?: string;
    onSelect?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
};
