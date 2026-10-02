import { useEffect, useMemo, useState } from 'react';
import { crmMessages } from '@/evo/crm/messages';
import { Moon, Sun } from '@/evo/icons';
import { InboxWorkspace, inboxMessages } from '@/evo/inbox';
import type { InboxAssignment, InboxComposeMode, InboxConversation } from '@/evo/inbox';
import { Button } from '@/evo/ui/button';
import { hydrateI18n, t } from '@/lib/i18n';
import {
    cliniqueEmail,
    inboxStoryContext,
    inboxStoryConversations,
    inboxStoryQueues,
    pharmacieWhatsapp,
} from '../data/inbox-story';

function hydrateInboxLab(): void {
    hydrateI18n('fr', { ...crmMessages, ...inboxMessages });
}

hydrateInboxLab();

function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
}

function readParam(name: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return new URLSearchParams(window.location.search).get(name);
}

function readThemeParam(): 'light' | 'dark' {
    return readParam('theme') === 'dark' ? 'dark' : 'light';
}

export function InboxPage() {
    hydrateInboxLab();
    const [theme, setTheme] = useState<'light' | 'dark'>(readThemeParam);
    const state = readParam('state');
    const view = readParam('view');
    const empty = state === 'empty';

    const seed = useMemo(() => {
        if (empty) {
            return [] as InboxConversation[];
        }

        return inboxStoryConversations;
    }, [empty]);

    const initialId =
        view === 'email'
            ? cliniqueEmail.id
            : view === 'replies'
              ? cliniqueEmail.id
              : pharmacieWhatsapp.id;

    const [selectedId, setSelectedId] = useState<string | number | null>(
        empty ? null : initialId,
    );
    const [queueKey, setQueueKey] = useState('all');
    const [channel, setChannel] = useState<string | null>(
        view === 'email' || view === 'replies' ? 'email' : view === 'queue' ? null : 'whatsapp',
    );
    const [assignment, setAssignment] = useState<InboxAssignment>('all');
    const [query, setQuery] = useState('');
    const [edits, setEdits] = useState<Record<string, InboxConversation>>({});

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const rows = seed.map((row) => edits[String(row.id)] ?? row);

    const filtered = rows.filter((row) => {
        if (channel && channel !== 'all' && row.channel !== channel) {
            return false;
        }

        if (assignment === 'mine' && !row.assignedTo) {
            return false;
        }

        if (assignment === 'unassigned' && row.assignedTo) {
            return false;
        }

        if (queueKey === 'unassigned' && row.assignedTo) {
            return false;
        }

        if (queueKey === 'mine' && !row.assignedTo) {
            return false;
        }

        if (queueKey !== 'all' && queueKey !== 'open' && queueKey !== 'mine' && queueKey !== 'unassigned') {
            if (row.channel !== queueKey) {
                return false;
            }
        }

        if (query.trim() !== '') {
            const hay = `${row.participant.name} ${row.subject ?? ''} ${row.preview ?? ''}`.toLowerCase();

            if (!hay.includes(query.trim().toLowerCase())) {
                return false;
            }
        }

        return true;
    });

    const selected = filtered.find((row) => String(row.id) === String(selectedId)) ?? filtered[0] ?? null;

    return (
        <div className="flex h-[calc(100dvh-48px)] min-h-[640px] flex-col bg-[var(--evo-canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--evo-hairline)] px-4 py-2">
                <div>
                    <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--evo-ink)]">
                        {t('Inbox')}
                    </h1>
                    <p className="text-[12px] text-[var(--evo-ink-muted)]">
                        Pharmacie Centrale · WhatsApp · +213 · Clinique El Djazair · e-mail
                    </p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    aria-label={theme === 'dark' ? 'Clair' : 'Sombre'}
                >
                    {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
            </div>
            <InboxWorkspace
                conversations={filtered}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
                queues={inboxStoryQueues}
                queueKey={queueKey}
                onQueueChange={setQueueKey}
                channel={channel}
                onChannelChange={setChannel}
                assignment={assignment}
                onAssignmentChange={setAssignment}
                query={query}
                onQueryChange={setQuery}
                context={selected ? inboxStoryContext(selected.id) : null}
                allowResolve
                initialMode={view === 'note' ? 'note' : 'reply'}
                defaultPickerOpen={view === 'templates'}
                empty={{
                    title: t('Empty inbox'),
                    description: t(
                        'Connect an official channel to receive WhatsApp, e-mail, web and Meta threads.',
                    ),
                }}
                onCompose={(payload) => {
                    if (!selected) {
                        return;
                    }

                    const mode: InboxComposeMode = payload.mode;
                    const nextMessage = {
                        id: `local-${Date.now()}`,
                        at: new Date().toISOString(),
                        direction: mode === 'note' ? ('internal' as const) : ('outbound' as const),
                        kind: mode === 'note' ? ('note' as const) : ('message' as const),
                        status: mode === 'note' ? 'logged' : 'sent',
                        body: payload.body,
                        attachments: payload.attachments,
                    };

                    setEdits((current) => {
                        const base = current[String(selected.id)] ?? selected;

                        return {
                            ...current,
                            [String(selected.id)]: {
                                ...base,
                                preview: payload.body,
                                lastMessageAt: nextMessage.at,
                                unread: 0,
                                messages: [...(base.messages ?? []), nextMessage],
                            },
                        };
                    });
                }}
            />
        </div>
    );
}
