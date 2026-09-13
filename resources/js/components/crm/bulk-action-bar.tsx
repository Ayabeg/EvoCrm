import { BulkActionBar as DataWorkspaceBulkActionBar } from '@/ds/workspace/BulkActionBar';
import type { BulkAction } from '@/ds/workspace/types';

type Member = { id: number; name: string };
type Sequence = { id: number; name: string };
type Stage = { id: number; name: string };

export function BulkActionBar({
    entity,
    selectedIds,
    members,
    sequences = [],
    stages = [],
    onClear,
}: {
    entity: 'contact' | 'deal';
    selectedIds: number[];
    members: Member[];
    sequences?: Sequence[];
    stages?: Stage[];
    onClear: () => void;
}) {
    const actions: BulkAction[] =
        entity === 'deal'
            ? ['assign_owner', 'move_stage', 'delete']
            : ['assign_owner', 'enroll_sequence', 'delete'];

    return (
        <DataWorkspaceBulkActionBar
            object={entity}
            selectedIds={selectedIds}
            actions={actions}
            members={members}
            sequences={sequences}
            stages={stages}
            onClear={onClear}
        />
    );
}
