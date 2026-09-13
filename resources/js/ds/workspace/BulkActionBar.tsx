import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BulkAction, BulkActionBarProps, DataWorkspaceEntity } from '@/ds/workspace/types';

function actionPathFor(object: DataWorkspaceEntity): string | null {
    if (object === 'contact') {
        return '/crm/contacts/bulk';
    }

    if (object === 'deal') {
        return '/crm/deals/bulk';
    }

    return null;
}

const ACTION_LABELS: Record<BulkAction, string> = {
    assign_owner: 'Assign owner',
    enroll_sequence: 'Enroll in sequence',
    move_stage: 'Move stage',
    delete: 'Delete',
    export: 'Export',
};

export function BulkActionBar({
    object,
    selectedIds,
    actions,
    members = [],
    sequences = [],
    stages = [],
    onClear,
}: BulkActionBarProps) {
    const [action, setAction] = useState<BulkAction>(actions[0] ?? 'assign_owner');
    const [ownerId, setOwnerId] = useState('');
    const [sequenceId, setSequenceId] = useState('');
    const [stageId, setStageId] = useState('');
    const actionPath = actionPathFor(object);

    function submit() {
        if (!actionPath) {
            return;
        }

        router.post(
            actionPath,
            {
                action,
                ids: selectedIds,
                owner_id: action === 'assign_owner' ? Number(ownerId) : null,
                sequence_id: action === 'enroll_sequence' ? Number(sequenceId) : null,
                stage_id: action === 'move_stage' ? Number(stageId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => onClear(),
            },
        );
    }

    if (selectedIds.length === 0) {
        return null;
    }

    return (
        <div
            className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-hairline bg-white px-4 py-2 md:px-8"
            data-crm="bulk-actions"
            data-ds="bulk-action-bar"
        >
            <p className="text-[13px] font-medium text-ink">{selectedIds.length} selected</p>
            <select
                value={action}
                onChange={(event) => setAction(event.target.value as BulkAction)}
                className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
            >
                {actions.map((item) => (
                    <option key={item} value={item}>
                        {ACTION_LABELS[item]}
                    </option>
                ))}
            </select>
            {action === 'assign_owner' ? (
                <select
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                    className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                >
                    <option value="">Owner</option>
                    {members.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.name}
                        </option>
                    ))}
                </select>
            ) : null}
            {action === 'enroll_sequence' ? (
                <select
                    value={sequenceId}
                    onChange={(event) => setSequenceId(event.target.value)}
                    className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                >
                    <option value="">Sequence</option>
                    {sequences.map((sequence) => (
                        <option key={sequence.id} value={sequence.id}>
                            {sequence.name}
                        </option>
                    ))}
                </select>
            ) : null}
            {action === 'move_stage' ? (
                <select
                    value={stageId}
                    onChange={(event) => setStageId(event.target.value)}
                    className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                >
                    <option value="">Stage</option>
                    {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                            {stage.name}
                        </option>
                    ))}
                </select>
            ) : null}
            {actionPath ? (
                <Button
                    type="button"
                    className="h-9"
                    onClick={submit}
                    disabled={selectedIds.length === 0}
                >
                    Apply
                </Button>
            ) : null}
            <button
                type="button"
                onClick={onClear}
                className="h-9 text-[13px] text-mute hover:text-ink"
            >
                Clear
            </button>
        </div>
    );
}
