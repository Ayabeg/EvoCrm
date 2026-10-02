import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { DataWorkspaceEmpty } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';

/**
 * Shared-table empty surface. Usable without domain children.
 * Title is a real heading for the status region (a11y).
 */
export function WorkspaceEmpty({
    empty,
    action,
}: {
    empty: DataWorkspaceEmpty;
    action?: ReactNode;
}) {
    return (
        <div
            className="grid flex-1 place-items-center px-4 py-8 md:px-8"
            data-ds="workspace-empty"
        >
            <EmptyState
                density="page"
                title={t(empty.title)}
                description={empty.body ? t(empty.body) : empty.body}
                as="h2"
                className="w-full max-w-md"
                action={action}
            />
        </div>
    );
}

export function workspaceEmptyAction(
    label: string | undefined,
    onClick: () => void,
): ReactNode | undefined {
    if (!label) {
        return undefined;
    }

    return (
        <Button type="button" className="h-9" onClick={onClick}>
            {t(label)}
        </Button>
    );
}
