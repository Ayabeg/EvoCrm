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
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
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
                                'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors',
                                selected
                                    ? 'border-brand bg-brand text-canvas'
                                    : 'border-hairline text-ink hover:bg-canvas-soft',
                            )}
                        >
                            <Icon className="size-3.5" />
                            {action.label}
                        </button>
                    );
                })}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            title="More actions"
                            className="inline-flex size-8 items-center justify-center rounded-full border border-hairline text-ink hover:bg-canvas-soft"
                        >
                            <MoreHorizontal className="size-3.5" />
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
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
}) {
    return (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)_280px]">
            <aside className="min-h-0 overflow-y-auto border-r border-hairline bg-canvas p-4">
                {left}
            </aside>
            <section className="min-h-0 overflow-y-auto bg-canvas p-5">
                {center}
            </section>
            <aside className="min-h-0 overflow-y-auto border-l border-hairline bg-canvas p-4">
                {right}
            </aside>
        </div>
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
        <div className="flex flex-wrap gap-4 border-b border-hairline">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        'border-b-2 pb-2 text-[13px]',
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
        <section className="rounded-md border border-hairline bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
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
            <div className="px-3 py-2 text-[13px]">
                {children ?? (
                    <p className="text-muted-foreground">{empty ?? 'None'}</p>
                )}
            </div>
        </section>
    );
}
