import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
    const [action, setAction] = useState(entity === 'deal' ? 'assign_owner' : 'assign_owner');
    const [ownerId, setOwnerId] = useState('');
    const [sequenceId, setSequenceId] = useState('');
    const [stageId, setStageId] = useState('');
    const actionPath = entity === 'deal' ? '/crm/deals/bulk' : '/crm/contacts/bulk';

    function submit() {
        const payload = {
            action,
            ids: selectedIds,
            owner_id: action === 'assign_owner' ? Number(ownerId) : null,
            sequence_id: action === 'enroll_sequence' ? Number(sequenceId) : null,
            stage_id: action === 'move_stage' ? Number(stageId) : null,
        };

        router.post(actionPath, payload, {
            preserveScroll: true,
            onSuccess: () => onClear(),
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-canvas-soft px-4 py-2 sm:px-6">
            <p className="text-ui text-ink">{selectedIds.length} selected</p>
            <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="h-8 rounded-md border border-hairline bg-background px-2 text-sm"
            >
                <option value="assign_owner">Assign owner</option>
                {entity === 'contact' ? <option value="enroll_sequence">Enroll in sequence</option> : null}
                {entity === 'deal' ? <option value="move_stage">Move stage</option> : null}
                <option value="delete">Delete</option>
            </select>
            {action === 'assign_owner' ? (
                <select
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                    className="h-8 rounded-md border border-hairline bg-background px-2 text-sm"
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
                    className="h-8 rounded-md border border-hairline bg-background px-2 text-sm"
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
                    className="h-8 rounded-md border border-hairline bg-background px-2 text-sm"
                >
                    <option value="">Stage</option>
                    {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                            {stage.name}
                        </option>
                    ))}
                </select>
            ) : null}
            <Button type="button" size="sm" onClick={submit} disabled={selectedIds.length === 0}>
                Apply
            </Button>
            <button type="button" onClick={onClear} className="text-[12px] font-medium text-brand">
                Clear
            </button>
        </div>
    );
}
