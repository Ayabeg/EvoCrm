import { useState } from 'react';
import { ContextChip, PageHeader } from '../components/PageHeader';
import { contactName, formatDateTime } from '../data/format';
import { getContact, getInboxConversations, getOwner } from '../data/selectors';

export function InboxPage() {
    const conversations = getInboxConversations();
    const [selectedId, setSelectedId] = useState(conversations[0]?.id);
    const selected = conversations.find((row) => row.id === selectedId) ?? conversations[0];
    const contact = selected ? getContact(selected.contactId) : null;

    return (
        <div className="flex h-[calc(100dvh-48px)] min-h-[640px] flex-col">
            <PageHeader
                title="Inbox"
                descriptor={`${conversations.length} fils · septembre 2026`}
                context={<ContextChip active>Tous les canaux</ContextChip>}
            />
            <div className="grid min-h-0 flex-1 overflow-hidden rounded-[8px] border border-[var(--evo-hairline)] bg-white xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="overflow-auto border-r border-[var(--evo-hairline)]">
                    {conversations.map((row) => {
                        const person = getContact(row.contactId);
                        const active = selected?.id === row.id;

                        return (
                            <button
                                key={row.id}
                                type="button"
                                onClick={() => setSelectedId(row.id)}
                                className={
                                    active
                                        ? 'block w-full border-b border-[var(--evo-hairline)] bg-[var(--evo-teal-soft)] px-4 py-3 text-left'
                                        : 'block w-full border-b border-[var(--evo-hairline)] px-4 py-3 text-left hover:bg-[var(--evo-hover)]'
                                }
                            >
                                <p className="text-[13px] font-medium">{contactName(person)}</p>
                                <p className="mt-0.5 truncate text-[12px] text-[var(--evo-ink-muted)]">{row.subject}</p>
                            </button>
                        );
                    })}
                </aside>
                <section className="overflow-auto px-6 py-5">
                    {selected && contact ? (
                        <>
                            <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{selected.subject}</h2>
                            <p className="mt-1 text-[13px] text-[var(--evo-ink-muted)]">
                                {contactName(contact)} · {getOwner(contact.ownerId).name}
                            </p>
                            <ol className="mt-6 space-y-4">
                                {selected.messages.map((message) => (
                                    <li key={message.id} className="text-[13px]">
                                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                                            {message.from === 'contact'
                                                ? contactName(contact)
                                                : getOwner(contact.ownerId).name}
                                            {' · '}
                                            {formatDateTime(message.at)}
                                        </p>
                                        <p className="mt-1 max-w-[62ch]">{message.body}</p>
                                    </li>
                                ))}
                            </ol>
                        </>
                    ) : (
                        <p className="text-[13px] text-[var(--evo-ink-muted)]">Aucune conversation.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
