import { Form, Link } from '@inertiajs/react';
import {
    Bolt,
    Calendar,
    Handshake,
    Inbox,
    Mail,
    MoreHorizontal,
    NotebookPen,
    Phone,
    Send,
    SendHorizonal,
    SquareCheck,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { cn } from '@/lib/utils';

export function RecordBack({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center text-[12px] font-medium text-brand"
        >
            ← {label}
        </Link>
    );
}

type ActionType = 'note' | 'email' | 'call' | 'task' | 'meeting';

const ACTION_DEFS: { type: ActionType; label: string; icon: typeof NotebookPen }[] = [
    { type: 'note', label: 'Note', icon: NotebookPen },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'call', label: 'Call', icon: Phone },
    { type: 'task', label: 'Task', icon: SquareCheck },
    { type: 'meeting', label: 'Meeting', icon: Calendar },
];

export function RecordActions({
    entityId,
    contactId,
    dealId,
    companyId,
}: {
    entityId: number;
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
}) {
    const [active, setActive] = useState<ActionType | null>(null);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                {ACTION_DEFS.map((action) => {
                    const Icon = action.icon;
                    const selected = active === action.type;

                    return (
                        <button
                            key={action.type}
                            type="button"
                            title={action.label}
                            onClick={() => setActive(selected ? null : action.type)}
                            className={cn(
                                'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors sm:min-h-8 sm:justify-start sm:px-2.5',
                                selected
                                    ? 'border-brand bg-brand text-canvas'
                                    : 'border-hairline text-ink hover:bg-canvas-soft',
                            )}
                        >
                            <Icon className="size-4 shrink-0 sm:size-3.5" />
                            <span className="truncate">{action.label}</span>
                        </button>
                    );
                })}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            title="More actions"
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-hairline text-ink hover:bg-canvas-soft sm:size-8 sm:min-h-8"
                        >
                            <MoreHorizontal className="size-4 sm:size-3.5" />
                            <span className="sr-only">More actions for record {entityId}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href={`/crm/deals?create=1&contact_id=${contactId}`}>
                                    <Handshake className="size-3.5" />
                                    Create deal
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href="/outbound/sequences">
                                    <Bolt className="size-3.5" />
                                    Enroll in sequence
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href="/outbound/campaigns">
                                    <SendHorizonal className="size-3.5" />
                                    Add to campaign
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href="/crm/segments">
                                    <Users className="size-3.5" />
                                    View segments
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Form
                                    action={`/crm/contacts/${contactId}/draft-email`}
                                    method="post"
                                    options={{ preserveScroll: true }}
                                    className="w-full"
                                >
                                    <button type="submit" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
                                        <Mail className="size-3.5" />
                                        Draft email with Evo
                                    </button>
                                </Form>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href="/inbox">
                                    <Inbox className="size-3.5" />
                                    Open in Desk
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        {contactId ? (
                            <DropdownMenuItem asChild>
                                <Link href="/outbound">
                                    <Send className="size-3.5" />
                                    Email via Outbound
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem asChild>
                            <Link href="/crm/deals/board">
                                <Handshake className="size-3.5" />
                                View deal board
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {active ? (
                <Form
                    action="/crm/activities"
                    method="post"
                    className="rounded-md border border-hairline bg-canvas-soft p-3"
                    resetOnSuccess
                    onSuccess={() => setActive(null)}
                    options={{ preserveScroll: true }}
                >
                    <input type="hidden" name="type" value={active} />
                    {contactId ? (
                        <input type="hidden" name="contact_id" value={contactId} />
                    ) : null}
                    {dealId ? <input type="hidden" name="deal_id" value={dealId} /> : null}
                    {companyId ? (
                        <input type="hidden" name="company_id" value={companyId} />
                    ) : null}
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Log {active}
                    </p>
                    <div className="grid gap-2">
                        <Input
                            name="subject"
                            placeholder={`${active} subject`}
                            required
                            className="h-8 bg-canvas"
                        />
                        <Input name="body" placeholder="Details (optional)" className="h-8 bg-canvas" />
                        {active === 'task' || active === 'meeting' ? (
                            <Input
                                name="due_at"
                                type="datetime-local"
                                className="h-8 bg-canvas"
                            />
                        ) : null}
                        <div className="flex gap-2">
                            <Button type="submit" className="h-8 text-[12px]">
                                Save {active}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-8 text-[12px]"
                                onClick={() => setActive(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Form>
            ) : null}
        </div>
    );
}

export function RecordShell({
    left,
    center,
    right,
    leftLabel = 'Details',
    centerLabel = 'Activity',
    rightLabel = 'Related',
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
}) {
    return (
        <AdaptiveWorkspaceShell
            left={left}
            center={center}
            right={right}
            leftLabel={leftLabel}
            centerLabel={centerLabel}
            rightLabel={rightLabel}
            defaultPanel="center"
        />
    );
}

export function ActivityTabs({
    tabs,
    active,
    onChange,
}: {
    tabs: { key: string; label: string }[];
    active: string;
    onChange: (key: string) => void;
}) {
    return (
        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-hairline px-1 pb-0 no-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        'shrink-0 border-b-2 px-3 pb-3 pt-1 text-[13px] min-h-11',
                        active === tab.key
                            ? 'border-brand font-medium text-ink'
                            : 'border-transparent text-muted-foreground',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export function AssociationCard({
    title,
    children,
    empty,
    addHref,
    addLabel = 'Add',
}: {
    title: string;
    children?: ReactNode;
    empty?: string;
    addHref?: string;
    addLabel?: string;
}) {
    return (
        <section className="rounded-lg border border-hairline bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <h3 className="text-[12px] font-semibold tracking-wide text-ink uppercase">
                    {title}
                </h3>
                {addHref ? (
                    <Link
                        href={addHref}
                        className="text-[12px] font-medium text-brand hover:underline"
                    >
                        {addLabel}
                    </Link>
                ) : (
                    <span className="text-[12px] font-medium text-muted-foreground">{addLabel}</span>
                )}
            </div>
            <div className="px-4 py-3 text-[13px] leading-relaxed">
                {children ?? (
                    <p className="text-muted-foreground">{empty ?? 'None'}</p>
                )}
            </div>
        </section>
    );
}
