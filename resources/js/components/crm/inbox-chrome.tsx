import { Link } from '@inertiajs/react';
import { Tray } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { contactInitials, formatContactName } from '@/lib/contact-name';
import { cn } from '@/lib/utils';

export type InboxEmbedState = 'ok' | 'blocked' | 'unreachable' | 'no-url';

export type InboxContact = {
    id: number;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_e164?: string | null;
    company?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
};

export type InboxFolder = {
    key: string;
    label: string;
    count: number | null;
};

const ALGIERS = 'Africa/Algiers';

export function inboxContactName(contact?: InboxContact | null): string {
    if (!contact) {
        return 'Unknown';
    }

    return formatContactName(contact.first_name, contact.last_name);
}

export function inboxInitials(contact?: InboxContact | null): string {
    if (!contact) {
        return '?';
    }

    return contactInitials(contact.first_name, contact.last_name);
}

export function formatInboxWhen(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: ALGIERS,
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function InboxPersonMark({
    name,
    initials,
    size = 'sm',
}: {
    name: string;
    initials: string;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            aria-hidden
            title={name}
            className={cn(
                'grid shrink-0 place-items-center bg-canvas-soft font-medium text-ink',
                size === 'md' ? 'size-8 text-[11px]' : 'size-7 text-[10px]',
            )}
        >
            {initials || '?'}
        </span>
    );
}

export function InboxStatusBanner({
    embedState,
    embedReason,
    configuredUrl,
}: {
    embedState: InboxEmbedState;
    embedReason: string | null;
    configuredUrl: string | null;
}) {
    if (embedState === 'ok' || embedState === 'no-url') {
        return null;
    }

    const host = configuredUrl ? safeHost(configuredUrl) : 'Desk';
    const title =
        embedState === 'blocked'
            ? `${host} is not framed here`
            : `${host} could not be reached`;

    return (
        <div
            role="status"
            data-crm="inbox-embed-banner"
            className="border-b border-hairline bg-white px-4 py-2 text-[12px] leading-5 text-mute"
        >
            <p>
                <span className="font-medium text-ink">{title}.</span>{' '}
                {embedReason ??
                    'Showing the CRM inbox. Desk stays on this host.'}
            </p>
        </div>
    );
}

export function InboxFolderRail({
    folders,
    folder,
    onSelect,
}: {
    folders: InboxFolder[];
    folder: string;
    onSelect: (key: string) => void;
}) {
    return (
        <nav aria-label="Inbox folders" className="px-2 py-2">
            <p className="px-2 pb-1.5 text-[10px] font-medium tracking-[0.08em] text-mute uppercase">
                Inbox
            </p>
            <ul>
                {folders.map((item) => {
                    const active = folder === item.key;

                    return (
                        <li key={item.key}>
                            <button
                                type="button"
                                onClick={() => onSelect(item.key)}
                                className={cn(
                                    'flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-[12px] transition-colors duration-150',
                                    active
                                        ? 'bg-canvas-soft font-medium text-ink'
                                        : 'text-mute hover:bg-canvas-soft hover:text-ink',
                                )}
                            >
                                <span className="truncate">{item.label}</span>
                                {item.count !== null ? (
                                    <span className="font-mono text-[11px] tabular-nums">
                                        {item.count}
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export function InboxContactSidebar({
    contact,
}: {
    contact: InboxContact;
}) {
    const facts: Array<{ label: string; value: ReactNode }> = [
        {
            label: 'Email',
            value: contact.email ?? 'No email',
        },
        {
            label: 'Phone',
            value: contact.phone_e164 ?? 'No phone',
        },
        {
            label: 'Owner',
            value: contact.owner?.name ?? 'No owner',
        },
        {
            label: 'Company',
            value: contact.company ? (
                <Link
                    href={`/crm/companies/${contact.company.id}`}
                    className="text-ink underline-offset-2 hover:underline"
                >
                    {contact.company.name}
                </Link>
            ) : (
                'No company'
            ),
        },
    ];

    return (
        <aside
            aria-label="Contact"
            className="w-full shrink-0 border-hairline bg-white lg:w-[15.5rem] lg:border-l"
        >
            <div className="border-b border-hairline px-3 py-2.5">
                <p className="text-[12px] font-medium text-ink">
                    {inboxContactName(contact)}
                </p>
                <p className="mt-0.5 text-[11px] text-mute">Contact</p>
            </div>
            <dl className="divide-y divide-hairline">
                {facts.map((fact) => (
                    <div key={fact.label} className="px-3 py-2">
                        <dt className="text-[10px] tracking-[0.06em] text-mute uppercase">
                            {fact.label}
                        </dt>
                        <dd className="mt-0.5 truncate text-[12px] text-ink">
                            {fact.value}
                        </dd>
                    </div>
                ))}
            </dl>
            <div className="px-3 py-2">
                <Link
                    href={`/crm/contacts/${contact.id}`}
                    className="text-[12px] font-medium text-brand underline-offset-2 hover:underline"
                >
                    Open contact
                </Link>
            </div>
        </aside>
    );
}

export function InboxEmbedSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading desk"
            className="absolute inset-0 z-10 grid grid-cols-[13rem_minmax(18rem,22rem)_minmax(0,1fr)] gap-px bg-hairline"
        >
            <div className="bg-white p-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={`folder-${index}`}
                        className="mb-2 h-3 animate-pulse bg-canvas-soft"
                    />
                ))}
            </div>
            <div className="bg-white">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={`row-${index}`}
                        className="flex items-center gap-2 border-b border-hairline px-3 py-2.5"
                    >
                        <div className="size-7 shrink-0 animate-pulse bg-canvas-soft" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="h-2.5 w-2/3 animate-pulse bg-canvas-soft" />
                            <div className="h-2 w-full animate-pulse bg-canvas-soft" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-4">
                <div className="mb-4 h-4 w-40 animate-pulse bg-canvas-soft" />
                <div className="h-16 w-3/5 animate-pulse bg-canvas-soft" />
                <div className="mt-3 ml-auto h-12 w-2/5 animate-pulse bg-canvas-soft" />
            </div>
        </div>
    );
}

export function InboxCaughtUpMark() {
    return (
        <span
            aria-hidden
            className="mx-auto mb-3 grid size-10 place-items-center border border-dashed border-hairline bg-canvas-soft text-mute"
        >
            <Tray className="size-5" weight="regular" />
        </span>
    );
}

function safeHost(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}
