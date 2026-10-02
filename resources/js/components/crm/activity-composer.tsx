import { Form, Link } from '@inertiajs/react';
import type { Icon } from '@phosphor-icons/react';
import { Calendar, CheckSquare, Envelope, Note, Phone } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';

export type ComposerType = 'note' | 'email' | 'call' | 'task' | 'meeting';

const ICONS: {
    type: ComposerType;
    label: string;
    icon: Icon;
}[] = [
    { type: 'email', label: 'Email', icon: Envelope },
    { type: 'call', label: 'Call', icon: Phone },
    { type: 'task', label: 'Task', icon: CheckSquare },
    { type: 'meeting', label: 'Event', icon: Calendar },
    { type: 'note', label: 'Note', icon: Note },
];

const CALL_OUTCOMES = [
    'Connected',
    'Left voicemail',
    'No answer',
    'Busy',
    'Wrong number',
];

function HiddenIds({
    contactId,
    dealId,
    companyId,
    ownerId,
}: {
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
    ownerId?: number | null;
}) {
    return (
        <>
            {contactId ? (
                <input type="hidden" name="contact_id" value={contactId} />
            ) : null}
            {dealId ? <input type="hidden" name="deal_id" value={dealId} /> : null}
            {companyId ? (
                <input type="hidden" name="company_id" value={companyId} />
            ) : null}
            {ownerId ? (
                <input type="hidden" name="owner_id" value={ownerId} />
            ) : null}
        </>
    );
}

export function LogCallForm({
    contactId,
    dealId,
    companyId,
    ownerId,
    onCancel,
}: {
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
    ownerId?: number | null;
    onCancel?: () => void;
}) {
    return (
        <Form
            action="/crm/activities"
            method="post"
            className="grid gap-2 border-t border-hairline pt-2"
            resetOnSuccess
            onSuccess={onCancel}
            options={{ preserveScroll: true }}
        >
            <input type="hidden" name="type" value="call" />
            <HiddenIds
                contactId={contactId}
                dealId={dealId}
                companyId={companyId}
                ownerId={ownerId}
            />
            <label className="grid gap-1 text-[11px] text-mute">
                Outcome
                <select
                    name="outcome"
                    defaultValue="Connected"
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink"
                >
                    {CALL_OUTCOMES.map((outcome) => (
                        <option key={outcome} value={outcome}>
                            {outcome}
                        </option>
                    ))}
                </select>
            </label>
            <label className="grid gap-1 text-[11px] text-mute">
                Direction
                <select
                    name="direction"
                    defaultValue="outbound"
                    className="h-8 rounded-md border border-hairline bg-canvas px-2 text-[13px] text-ink"
                >
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                </select>
            </label>
            <label className="grid gap-1 text-[11px] text-mute">
                Date and time
                <Input
                    name="logged_at"
                    type="datetime-local"
                    className="h-8 bg-canvas"
                />
            </label>
            <Input
                name="subject"
                placeholder="Call subject"
                className="h-8 bg-canvas"
            />
            <Input
                name="body"
                placeholder="Comment"
                className="h-8 bg-canvas"
            />
            <div className="flex gap-2">
                <Button type="submit" size="sm">
                    Log call
                </Button>
                {onCancel ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                ) : null}
            </div>
        </Form>
    );
}

export default function ActivityComposer({
    contactId,
    dealId,
    companyId,
    ownerId,
    emailHref,
    defaultType = null,
}: {
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
    ownerId?: number | null;
    emailHref?: string;
    defaultType?: ComposerType | null;
}) {
    const [active, setActive] = useState<ComposerType | null>(defaultType);

    return (
        <section
            data-testid="activity-composer"
            className="space-y-2"
            aria-label="Activity composer"
        >
            <div
                role="toolbar"
                aria-label="Log activity"
                className="record-action-group"
            >
                {ICONS.map((action) => {
                    if (action.type === 'email' && emailHref) {
                        return (
                            <Button
                                key={action.type}
                                asChild
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-[12px] font-medium"
                                title="Email via Outbound"
                            >
                                <Link href={emailHref}>
                                    <action.icon className="size-3.5" aria-hidden />
                                    {action.label}
                                </Link>
                            </Button>
                        );
                    }

                    const selected = active === action.type;

                    return (
                        <Button
                            key={action.type}
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-pressed={selected}
                            title={action.label}
                            className="h-8 gap-1.5 px-2 text-[12px] font-medium"
                            onClick={() =>
                                setActive(selected ? null : action.type)
                            }
                        >
                            <action.icon className="size-3.5" aria-hidden />
                            {action.label}
                        </Button>
                    );
                })}
            </div>
            {active === 'call' ? (
                <LogCallForm
                    contactId={contactId}
                    dealId={dealId}
                    companyId={companyId}
                    ownerId={ownerId}
                    onCancel={() => setActive(null)}
                />
            ) : active ? (
                <Form
                    action="/crm/activities"
                    method="post"
                    className="grid gap-2 border-t border-hairline pt-2"
                    resetOnSuccess
                    onSuccess={() => setActive(null)}
                    options={{ preserveScroll: true }}
                >
                    <input type="hidden" name="type" value={active} />
                    <HiddenIds
                        contactId={contactId}
                        dealId={dealId}
                        companyId={companyId}
                        ownerId={ownerId}
                    />
                    <Input
                        name="subject"
                        placeholder={`${active} subject`}
                        required
                        className="h-8 bg-canvas"
                    />
                    <Input
                        name="body"
                        placeholder="Details (optional)"
                        className="h-8 bg-canvas"
                    />
                    {active === 'task' || active === 'meeting' ? (
                        <Input
                            name="due_at"
                            type="datetime-local"
                            className="h-8 bg-canvas"
                        />
                    ) : null}
                    <div className="flex gap-2">
                        <Button type="submit" size="sm">
                            Save {active}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActive(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            ) : null}
        </section>
    );
}
