import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useQuickRecord } from '@/ds/workspace/quick-record/context';
import { fullRecordHref, parseRecordRef } from '@/ds/workspace/quick-record/ref';
import type { RecordRef } from '@/ds/workspace/quick-record/types';

/**
 * P10 invocation primitive. Callers pass a RecordRef and a mode.
 * They do not choose hydration, width, adapters, tabs, or permissions.
 */
export function RecordLink({
    record,
    mode = 'full',
    children,
    className,
}: {
    record: RecordRef;
    mode?: 'drawer' | 'full';
    children: ReactNode;
    className?: string;
}) {
    const { openRecord } = useQuickRecord();
    const href = fullRecordHref(record);

    if (mode === 'drawer') {
        return (
            <button
                type="button"
                className={className}
                onClick={(event) => {
                    openRecord(record, { opener: event.currentTarget });
                }}
            >
                {children}
            </button>
        );
    }

    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

export function recordLinkHref(record: { type: string; id: number | string }): string | null {
    const ref = parseRecordRef(record.type, record.id);

    return ref ? fullRecordHref(ref) : null;
}
