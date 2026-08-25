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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
                        <Button
                            key={action.type}
                            type="button"
                            title={action.label}
                            size="sm"
                            variant={selected ? 'default' : 'outline'}
                            shape="pill"
                            onClick={() => setActive(selected ? null : action.type)}
                            className="min-h-11 sm:min-h-8"
                        >
                            <Icon className="size-4 shrink-0 sm:size-3.5" />
                            <span className="truncate">{action.label}</span>
                        </Button>
                    );
                })}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="More actions"
                            className="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
                        >
                            <MoreHorizontal className="size-4 sm:size-3.5" />
                            <span className="sr-only">More actions for record {entityId}</span>
                        </Button>
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
        <Tabs value={active} onValueChange={onChange} className="w-full">
            <TabsList className="no-scrollbar h-auto w-full min-h-11 justify-start gap-0 border-b-0 bg-transparent p-0">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="min-h-11 shrink-0 px-3 py-2 sm:min-h-9"
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
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
        <Card elevated={false} className="overflow-hidden py-0">
            <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle as="h3" className="text-[12px] uppercase tracking-wide">
                    {title}
                </CardTitle>
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
            </CardHeader>
            <CardContent className="py-3 text-[13px] leading-relaxed">
                {children ?? (
                    <p className="text-muted-foreground">{empty ?? 'None'}</p>
                )}
            </CardContent>
        </Card>
    );
}
