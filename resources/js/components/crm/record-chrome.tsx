import { Form, Link } from '@inertiajs/react';
import {
    Calendar,
    Mail,
    MoreHorizontal,
    NotebookPen,
    Phone,
    SquareCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
    const actions = [
        { type: 'note', label: 'Note', icon: NotebookPen },
        { type: 'email', label: 'Email', icon: Mail },
        { type: 'call', label: 'Call', icon: Phone },
        { type: 'task', label: 'Task', icon: SquareCheck },
        { type: 'meeting', label: 'Meeting', icon: Calendar },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => {
                const Icon = action.icon;

                return (
                    <Form
                        key={action.type}
                        action="/crm/activities"
                        method="post"
                        className="inline"
                    >
                        <input type="hidden" name="type" value={action.type} />
                        <input
                            type="hidden"
                            name="subject"
                            value={action.label}
                        />
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
                        <button
                            type="submit"
                            title={action.label}
                            className="inline-flex size-8 items-center justify-center rounded-full border border-hairline text-ink hover:bg-canvas-soft"
                        >
                            <Icon className="size-3.5" />
                            <span className="sr-only">{action.label}</span>
                        </button>
                    </Form>
                );
            })}
            <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full border border-hairline text-ink"
                title="More"
            >
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">{entityId} more</span>
            </button>
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
}: {
    title: string;
    children?: ReactNode;
    empty?: string;
}) {
    return (
        <section className="rounded-md border border-hairline">
            <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                <h3 className="text-[12px] font-semibold tracking-wide text-ink uppercase">
                    {title}
                </h3>
                <span className="text-[12px] font-medium text-brand">Add</span>
            </div>
            <div className="px-3 py-2 text-[13px]">
                {children ?? (
                    <p className="text-muted-foreground">{empty ?? 'None'}</p>
                )}
            </div>
        </section>
    );
}
