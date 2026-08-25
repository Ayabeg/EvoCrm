import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Member = { id: number; name: string };
type Split = { user_id: number; percent: number; user?: { name: string } | null };

export default function DealSplits({
    dealId,
    members,
    splits,
    canManage,
}: {
    dealId: number;
    members: Member[];
    splits: Split[];
    canManage: boolean;
}) {
    const [rows, setRows] = useState(
        splits.length > 0
            ? splits.map((split) => ({ user_id: String(split.user_id), percent: String(split.percent) }))
            : [{ user_id: members[0] ? String(members[0].id) : '', percent: '100' }],
    );

    if (!canManage && splits.length === 0) {
        return null;
    }

    return (
        <section className="rounded border border-hairline bg-canvas p-3 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">Deal splits</h3>
            {splits.length > 0 ? (
                <ul className="mb-2 space-y-1 text-[12px]">
                    {splits.map((split) => (
                        <li key={split.user_id}>
                            {split.user?.name ?? `User ${split.user_id}`} · {split.percent}%
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mb-2 text-[12px] text-mute">No split yet. Totals must equal 100%.</p>
            )}
            {canManage ? (
                <Form action={`/crm/deals/${dealId}/splits`} method="put" className="space-y-2">
                    {rows.map((row, index) => (
                        <div key={index} className="grid grid-cols-[1fr_80px_auto] gap-1">
                            <select
                                name={`splits[${index}][user_id]`}
                                value={row.user_id}
                                onChange={(event) => {
                                    const next = [...rows];
                                    next[index] = { ...row, user_id: event.target.value };
                                    setRows(next);
                                }}
                                className="h-7 rounded border border-hairline bg-canvas px-1 text-[11px]"
                            >
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                name={`splits[${index}][percent]`}
                                type="number"
                                min={1}
                                max={100}
                                value={row.percent}
                                onChange={(event) => {
                                    const next = [...rows];
                                    next[index] = { ...row, percent: event.target.value };
                                    setRows(next);
                                }}
                                className="h-7 rounded border border-hairline bg-canvas px-1 text-[11px]"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => setRows(rows.filter((_, rowIndex) => rowIndex !== index))}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-7 text-[11px]"
                            onClick={() =>
                                setRows([...rows, { user_id: members[0] ? String(members[0].id) : '', percent: '0' }])
                            }
                        >
                            Add teammate
                        </Button>
                        <Button className="h-7 text-[11px]">Save splits</Button>
                    </div>
                </Form>
            ) : null}
        </section>
    );
}
