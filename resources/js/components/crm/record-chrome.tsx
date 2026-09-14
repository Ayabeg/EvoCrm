import { Form, Link } from '@inertiajs/react';
import {
    DotsThree,
    Envelope,
    Handshake,
    Lightning,
    PaperPlaneRight,
    PaperPlaneTilt,
    Tray,
    UserPlus,
    UsersThree,
    ChatCircle,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AdaptiveWorkspaceShell } from '@/components/crm/adaptive-workspace-shell';
import { LogCallForm } from '@/components/crm/activity-composer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function RecordBack({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center text-[11px] font-medium text-mute hover:text-ink"
        >
            ← {t(label)}
        </Link>
    );
}

type ActionType = 'note' | 'email' | 'call' | 'task' | 'meeting';

const ACTION_DEFS: { type: ActionType; label: string }[] = [
    { type: 'note', label: 'Note' },
    { type: 'email', label: 'Email' },
    { type: 'call', label: 'Call' },
    { type: 'task', label: 'Task' },
    { type: 'meeting', label: 'Meet' },
];

export function RecordActions({
    entityId,
    contactId,
    dealId,
    companyId,
    secondary,
    whatsappHref = '/inbox',
}: {
    entityId: number;
    contactId?: number | null;
    dealId?: number | null;
    companyId?: number | null;
    secondary?: ReactNode;
    whatsappHref?: string;
}) {
    const [active, setActive] = useState<ActionType | null>(null);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <div
                    role="toolbar"
                    aria-label={t('Record actions')}
                    className="record-action-group"
                >
                    {ACTION_DEFS.map((action) => {
                        const selected = active === action.type;

                        return (
                            <Button
                                key={action.type}
                                type="button"
                                size="sm"
                                variant="ghost"
                                aria-pressed={selected}
                                title={t(action.label)}
                                onClick={() =>
                                    setActive(selected ? null : action.type)
                                }
                                className="h-8 px-2 text-[12px] font-medium"
                            >
                                {t(action.label)}
                            </Button>
                        );
                    })}
                    <Button
                        asChild
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="WhatsApp"
                        className="h-8 px-2 text-[12px] font-medium"
                    >
                        <Link href={whatsappHref}>
                            <ChatCircle className="size-3.5" aria-hidden />
                            WhatsApp
                        </Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="More actions"
                                aria-label={`More actions for record ${entityId}`}
                                className="h-8 px-2 text-[12px] font-medium"
                            >
                                <DotsThree
                                    className="size-3.5"
                                    aria-hidden
                                />
                                More
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/crm/deals?create=1&contact_id=${contactId}`}
                                    >
                                        <Handshake className="size-3.5" aria-hidden />
                                        Create deal
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {companyId && !contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/crm/contacts?create=1">
                                        <UserPlus className="size-3.5" aria-hidden />
                                        Add contact
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/outbound/sequences">
                                        <Lightning className="size-3.5" aria-hidden />
                                        Enroll in sequence
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/outbound/campaigns">
                                        <PaperPlaneRight className="size-3.5" aria-hidden />
                                        Add to campaign
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/crm/segments">
                                        <UsersThree className="size-3.5" aria-hidden />
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
                                        <button
                                            type="submit"
                                            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
                                        >
                                            <Envelope className="size-3.5" aria-hidden />
                                            Draft email with Evo
                                        </button>
                                    </Form>
                                </DropdownMenuItem>
                            ) : null}
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/inbox">
                                        <Tray className="size-3.5" aria-hidden />
                                        Open in Desk
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {contactId ? (
                                <DropdownMenuItem asChild>
                                    <Link href="/outbound">
                                        <PaperPlaneTilt className="size-3.5" aria-hidden />
                                        Email via Outbound
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem asChild>
                                <Link href="/crm/deals/board">
                                    <Handshake className="size-3.5" aria-hidden />
                                    View deal board
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {secondary}
            </div>
            {active === 'call' ? (
                <LogCallForm
                    contactId={contactId}
                    dealId={dealId}
                    companyId={companyId}
                    onCancel={() => setActive(null)}
                />
            ) : active ? (
                <Form
                    action="/crm/activities"
                    method="post"
                    className="border-t border-hairline pt-2"
                    resetOnSuccess
                    onSuccess={() => setActive(null)}
                    options={{ preserveScroll: true }}
                >
                    <input type="hidden" name="type" value={active} />
                    {contactId ? (
                        <input
                            type="hidden"
                            name="contact_id"
                            value={contactId}
                        />
                    ) : null}
                    {dealId ? (
                        <input type="hidden" name="deal_id" value={dealId} />
                    ) : null}
                    {companyId ? (
                        <input
                            type="hidden"
                            name="company_id"
                            value={companyId}
                        />
                    ) : null}
                    <div className="grid gap-2">
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
    leftLabel = 'About',
    centerLabel = 'Workspace',
    rightLabel = 'Ask Evo',
    leftClassName,
    centerClassName,
    rightClassName,
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    leftClassName?: string;
    centerClassName?: string;
    rightClassName?: string;
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
            leftClassName={cn('md:px-4 md:py-4', leftClassName)}
            centerClassName={cn('sm:px-5 sm:py-4', centerClassName)}
            rightClassName={cn('md:px-4 md:py-4', rightClassName)}
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
            <TabsList className="no-scrollbar h-auto min-h-9 w-full justify-start gap-0 border-b-0 bg-transparent p-0">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="min-h-9 shrink-0 px-3 py-1.5 after:shadow-none data-[state=active]:after:shadow-none sm:min-h-8"
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
        <Card
            elevated={false}
            className="overflow-hidden border-0 bg-transparent py-0 shadow-none"
        >
            <CardHeader className="flex flex-row items-center justify-between px-0 py-0">
                <CardTitle
                    as="h3"
                    className="text-[11px] font-semibold tracking-wide text-mute uppercase"
                >
                    {title}
                </CardTitle>
                {addHref ? (
                    <Link
                        href={addHref}
                        className="text-[12px] font-medium text-ink hover:underline"
                    >
                        {addLabel}
                    </Link>
                ) : addLabel !== 'Add' ? (
                    <span className="text-[12px] text-mute">{addLabel}</span>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-1 px-0 pt-2 pb-0 text-[13px] leading-snug">
                {children ?? <p className="text-mute">{empty ?? 'None'}</p>}
            </CardContent>
        </Card>
    );
}

export function RelatedRecordLink({
    href,
    children,
    meta,
}: {
    href: string;
    children: ReactNode;
    meta?: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-baseline justify-between gap-2 py-1 text-[13px] text-ink hover:underline"
        >
            <span className="min-w-0 truncate">{children}</span>
            {meta ? (
                <span className="shrink-0 text-[11px] text-mute">{meta}</span>
            ) : null}
        </Link>
    );
}
