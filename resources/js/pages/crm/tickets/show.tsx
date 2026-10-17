import { Form, Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AskEvoPanel, { AskEvoTrigger } from '@/components/crm/ask-evo-panel';
import type { AskEvoPayload } from '@/components/crm/ask-evo-panel';
import { SkeletonRecord } from '@/components/crm/empty-room';
import { InlineRecordField } from '@/components/crm/inline-record-field';
import {
    AssociationCard,
    RecordBack,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordSection,
    RecordStatusBadge,
    formatRecordWhen,
} from '@/components/crm/record-hub';
import { RecordPath } from '@/components/crm/record-path';
import type { PathStep } from '@/components/crm/record-path';
import { DeskGlass } from '@/components/desk/desk-glass';
import { RecordIdentity, RecordPageFrame, RecordShell } from '@/evo/crm/record';
import { Button } from '@/evo/ui/button';
import { Textarea } from '@/evo/ui/textarea';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';

type TicketRecord = {
    id: number;
    number: string;
    subject: string;
    status: string;
    status_label: string;
    priority: string;
    channel: string;
    channel_label: string;
    created_at?: string | null;
    sla_due_at?: string | null;
    sla_label?: string | null;
    sla_breached?: boolean;
    satisfaction_rating?: number | null;
    satisfaction_feedback?: string | null;
    satisfaction_submitted_at?: string | null;
    thread_id?: number | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
    } | null;
    company?: { id: number; name: string } | null;
    owner?: { id: number; name: string } | null;
    queue?: { id: number; name: string } | null;
    deal?: { id: number; title: string } | null;
};

type ThreadPreview = {
    id: number;
    subject?: string | null;
    channel?: string | null;
};

type ThreadMessage = {
    id: number;
    body: string | null;
    direction: string;
    type: string;
    created_at?: string | null;
};

type KnowledgeArticlePreview = {
    id: number;
    title: string;
    category?: string | null;
    excerpt?: string | null;
    body: string;
    tags?: string[];
};

type TicketHistoryEvent = {
    id: number;
    type: string;
    subject: string;
    actor_name?: string | null;
    created_at?: string | null;
};

type SupportQueue = { id: number; name: string; round_robin?: boolean };

type PathState = {
    steps: PathStep[];
    current: string;
    next: string | null;
    complete: boolean;
};

export default function TicketShow({
    ticket,
    path,
    askEvo,
    thread,
    messages = [],
    knowledgeArticles = [],
    ticketHistory = [],
    queues = [],
    attachableThreads = [],
    members = [],
    associations,
}: {
    ticket: TicketRecord;
    path: PathState;
    askEvo?: AskEvoPayload | null;
    thread?: ThreadPreview | null;
    messages?: ThreadMessage[];
    knowledgeArticles?: KnowledgeArticlePreview[];
    ticketHistory?: TicketHistoryEvent[];
    queues?: SupportQueue[];
    attachableThreads?: ThreadPreview[];
    members?: { id: number; name: string }[];
    associations?: {
        contact?: {
            id: number;
            first_name: string;
            last_name?: string | null;
            email?: string | null;
            phone_e164?: string | null;
        } | null;
        company?: { id: number; name: string } | null;
        deal?: { id: number; title: string } | null;
        quotes?: {
            id: number;
            status?: string | null;
            total_cents?: number | null;
        }[];
    };
}) {
    const loading = useInertiaLoading();
    const [mode, setMode] = useState<'reply' | 'note'>('reply');
    const [replyBody, setReplyBody] = useState('');
    const [knowledgeQuery, setKnowledgeQuery] = useState('');
    const action = `/crm/tickets/${ticket.id}`;
    const askAction = `/crm/tickets/${ticket.id}/ask`;
    const contact = associations?.contact ?? ticket.contact ?? null;
    const company = associations?.company ?? ticket.company ?? null;
    const deal = associations?.deal ?? ticket.deal ?? null;
    const quotes = associations?.quotes ?? [];
    const contactName = contact
        ? `${contact.first_name} ${contact.last_name ?? ''}`.trim()
        : 'No contact';
    const closed = path.complete;
    const filteredKnowledgeArticles = useMemo(() => {
        const query = knowledgeQuery.trim().toLowerCase();

        if (!query) {
            return knowledgeArticles;
        }

        return knowledgeArticles.filter((article) =>
            [
                article.title,
                article.category,
                article.excerpt,
                ...(article.tags ?? []),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(query),
        );
    }, [knowledgeArticles, knowledgeQuery]);
    const replyLabel = thread?.channel?.toLowerCase().includes('email')
        ? 'Send email'
        : thread?.channel?.toLowerCase().includes('whatsapp')
          ? 'Send on WhatsApp'
          : 'Send message';

    function selectPath(step: string) {
        if (closed || step === path.current) {
            return;
        }

        router.put(action, { status: step }, { preserveScroll: true });
    }

    function markComplete() {
        if (!path.next) {
            return;
        }

        selectPath(path.next);
    }

    return (
        <>
            <Head title={`${ticket.number} · ${ticket.subject}`} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <>
                            <RecordBack
                                href="/crm/tickets"
                                label="Back to Tickets"
                            />
                            <RecordIdentity
                                title={ticket.subject}
                                kind={ticket.number}
                                subtitle={
                                    <>
                                        {contactName}
                                        {company?.name
                                            ? ` · ${company.name}`
                                            : ''}
                                        {ticket.owner?.name
                                            ? ` · ${ticket.owner.name}`
                                            : ' · Unassigned'}
                                    </>
                                }
                                badge={
                                    <RecordStatusBadge>
                                        {ticket.status_label}
                                    </RecordStatusBadge>
                                }
                                actions={
                                    <div className="md:hidden">
                                        <AskEvoTrigger
                                            action={askAction}
                                            insight={askEvo}
                                        />
                                    </div>
                                }
                            />
                            <RecordPath
                                steps={path.steps}
                                current={path.current}
                                disabled={closed}
                                label="Ticket path"
                                onSelect={selectPath}
                                onComplete={closed ? undefined : markComplete}
                            />
                        </>
                    }
                >
                    <RecordShell
                        leftLabel="Properties"
                        centerLabel="Conversation"
                        rightLabel="Ask Evo"
                        left={
                            <div className="space-y-4">
                                <RecordSection title="About">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Number"
                                            value={ticket.number}
                                        />
                                        <RecordFact
                                            label="Status"
                                            value={ticket.status_label}
                                        />
                                        <RecordFact
                                            label="Channel"
                                            value={ticket.channel_label}
                                        />
                                        <RecordFact
                                            label="SLA"
                                            value={ticket.sla_label ?? '—'}
                                        />
                                    </RecordFactList>
                                    <div className="space-y-3">
                                        <InlineRecordField
                                            label="Subject"
                                            name="subject"
                                            value={ticket.subject}
                                            action={action}
                                        />
                                        <label className="block">
                                            <span className="block text-[11px] text-mute">
                                                Priority
                                            </span>
                                            <select
                                                className="mt-0.5 h-8 w-full rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                                value={ticket.priority}
                                                onChange={(event) =>
                                                    router.put(
                                                        action,
                                                        {
                                                            priority:
                                                                event.target
                                                                    .value,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">
                                                    Medium
                                                </option>
                                                <option value="high">
                                                    High
                                                </option>
                                            </select>
                                        </label>
                                        {queues.length > 0 ? (
                                            <label className="block">
                                                <span className="block text-[12px] text-mute">
                                                    {t('Support queue')}
                                                </span>
                                                <select
                                                    className="mt-0.5 h-9 w-full rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                                    value={ticket.queue?.id ?? ''}
                                                    onChange={(event) =>
                                                        router.put(
                                                            action,
                                                            {
                                                                queue_id:
                                                                    event.target
                                                                        .value,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        {t('No queue')}
                                                    </option>
                                                    {queues.map((queue) => (
                                                        <option
                                                            key={queue.id}
                                                            value={queue.id}
                                                        >
                                                            {queue.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        ) : null}
                                        <label className="block">
                                            <span className="block text-[11px] text-mute">
                                                Owner
                                            </span>
                                            <select
                                                className="mt-0.5 h-8 w-full rounded border border-hairline bg-canvas px-2 text-[13px] text-ink"
                                                value={ticket.owner?.id ?? ''}
                                                onChange={(event) =>
                                                    router.put(
                                                        action,
                                                        {
                                                            owner_id:
                                                                event.target
                                                                    .value,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Unassigned
                                                </option>
                                                {members.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </RecordSection>
                                <RecordSection
                                    title={t('Customer satisfaction')}
                                >
                                    {ticket.satisfaction_rating ? (
                                        <div className="space-y-2 text-[13px]">
                                            <RecordFact
                                                label={t('Rating')}
                                                value={`${ticket.satisfaction_rating}/5`}
                                            />
                                            {ticket.satisfaction_feedback ? (
                                                <p className="rounded-md bg-canvas-soft p-2 text-ink">
                                                    {
                                                        ticket.satisfaction_feedback
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : closed ? (
                                        <Form
                                            action={`/crm/tickets/${ticket.id}/satisfaction`}
                                            method="post"
                                            className="space-y-2"
                                        >
                                            <label className="block text-[12px] font-medium text-ink">
                                                {t(
                                                    'How satisfied was the customer?',
                                                )}
                                                <select
                                                    name="rating"
                                                    required
                                                    defaultValue=""
                                                    className="mt-1 h-8 w-full rounded border border-hairline bg-canvas px-2 text-[13px] font-normal"
                                                >
                                                    <option value="" disabled>
                                                        {t('Choose a rating')}
                                                    </option>
                                                    <option value="5">
                                                        5 ·{' '}
                                                        {t('Very satisfied')}
                                                    </option>
                                                    <option value="4">
                                                        4 · {t('Satisfied')}
                                                    </option>
                                                    <option value="3">
                                                        3 · {t('Neutral')}
                                                    </option>
                                                    <option value="2">
                                                        2 · {t('Dissatisfied')}
                                                    </option>
                                                    <option value="1">
                                                        1 ·{' '}
                                                        {t('Very dissatisfied')}
                                                    </option>
                                                </select>
                                            </label>
                                            <Textarea
                                                name="feedback"
                                                placeholder={t(
                                                    'Optional feedback',
                                                )}
                                                className="min-h-16"
                                            />
                                            <Button size="sm">
                                                {t('Save feedback')}
                                            </Button>
                                        </Form>
                                    ) : (
                                        <p className="text-[13px] text-mute">
                                            {t(
                                                'Feedback becomes available after the ticket is closed.',
                                            )}
                                        </p>
                                    )}
                                </RecordSection>
                                <RecordSection title={t('Case history')}>
                                    {ticketHistory.length > 0 ? (
                                        <ol className="space-y-3">
                                            {ticketHistory.map((event) => (
                                                <li
                                                    key={event.id}
                                                    className="border-s-2 border-hairline ps-3"
                                                >
                                                    <p className="text-[13px] text-ink">
                                                        {event.subject}
                                                    </p>
                                                    <p className="mt-0.5 text-[12px] text-mute">
                                                        {event.actor_name ??
                                                            t('System')}
                                                        {formatRecordWhen(
                                                            event.created_at,
                                                        )
                                                            ? ` · ${formatRecordWhen(event.created_at)}`
                                                            : ''}
                                                    </p>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p className="text-[13px] text-mute">
                                            {t('No case history yet.')}
                                        </p>
                                    )}
                                </RecordSection>
                            </div>
                        }
                        center={
                            thread ? (
                                <div
                                    className="flex h-full min-h-[22rem] flex-col"
                                    data-ticket="thread"
                                >
                                    <DeskGlass
                                        as="header"
                                        className="flex items-center justify-between gap-2 border-b px-1 py-2"
                                    >
                                        <p className="truncate text-[13px] font-medium text-ink">
                                            {thread.channel ?? 'WhatsApp'} ·{' '}
                                            {thread.subject ?? contactName}
                                        </p>
                                        <Link
                                            href={`/conversations?thread=${thread.id}`}
                                            className="shrink-0 text-[12px] font-medium text-ink hover:underline"
                                        >
                                            Open in Desk
                                        </Link>
                                    </DeskGlass>
                                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-canvas-soft p-3">
                                        {messages.length === 0 ? (
                                            <p className="text-[13px] text-mute">
                                                Thread is attached. Reply on
                                                WhatsApp below.
                                            </p>
                                        ) : (
                                            messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 ${
                                                        message.type === 'note'
                                                            ? 'bg-muted text-ink'
                                                            : message.direction ===
                                                                'outbound'
                                                              ? 'ms-auto border border-hairline bg-canvas text-ink'
                                                              : 'bg-canvas text-ink shadow-[var(--aurora-shadow-medium)]'
                                                    }`}
                                                >
                                                    {message.type === 'note' ? (
                                                        <p className="mb-1 text-[11px] font-medium text-mute">
                                                            Private note
                                                        </p>
                                                    ) : null}
                                                    <p className="text-[13px]">
                                                        {message.body}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Form
                                        action={`/desk/threads/${thread.id}/reply`}
                                        method="post"
                                        resetOnSuccess={['body']}
                                        onSuccess={() => setReplyBody('')}
                                    >
                                        {({ processing }) => (
                                            <DeskGlass
                                                as="footer"
                                                className="border-t p-3"
                                            >
                                                <div className="mb-2 flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMode('reply')
                                                        }
                                                        className={
                                                            mode === 'reply'
                                                                ? 'border-b-2 border-brand pb-1 text-[13px] font-medium'
                                                                : 'text-[13px] text-mute'
                                                        }
                                                    >
                                                        Reply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMode('note')
                                                        }
                                                        className={
                                                            mode === 'note'
                                                                ? 'border-b-2 border-brand pb-1 text-[13px] font-medium'
                                                                : 'text-[13px] text-mute'
                                                        }
                                                    >
                                                        Note
                                                    </button>
                                                </div>
                                                {mode === 'note' ? (
                                                    <input
                                                        type="hidden"
                                                        name="as_note"
                                                        value="1"
                                                    />
                                                ) : null}
                                                {mode === 'reply' &&
                                                knowledgeArticles.length > 0 ? (
                                                    <div className="mb-2 rounded-md border border-hairline bg-canvas-soft p-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-[12px] font-medium text-ink">
                                                                Use knowledge
                                                            </p>
                                                            <span className="text-[12px] text-mute">
                                                                Inserts a draft
                                                            </span>
                                                        </div>
                                                        <input
                                                            aria-label="Search knowledge"
                                                            value={
                                                                knowledgeQuery
                                                            }
                                                            onChange={(event) =>
                                                                setKnowledgeQuery(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Search help articles"
                                                            className="mt-1.5 h-9 w-full rounded border border-hairline bg-canvas px-2 text-[13px] text-ink outline-none placeholder:text-mute focus:border-brand"
                                                        />
                                                        {filteredKnowledgeArticles.length >
                                                        0 ? (
                                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                                {filteredKnowledgeArticles.map(
                                                                    (article) => (
                                                                    <button
                                                                        key={
                                                                            article.id
                                                                        }
                                                                        type="button"
                                                                        title={
                                                                            article.excerpt ??
                                                                            article.title
                                                                        }
                                                                        onClick={() =>
                                                                            setReplyBody(
                                                                                (current) =>
                                                                                    current.trim()
                                                                                        ? `${current.trim()}\n\n${article.body}`
                                                                                        : article.body,
                                                                            )
                                                                        }
                                                                        className="max-w-full truncate rounded border border-hairline bg-canvas px-2 py-1 text-start text-[12px] font-medium text-ink hover:border-brand hover:text-brand"
                                                                    >
                                                                        {article.title}
                                                                    </button>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="mt-1.5 text-[12px] text-mute">
                                                                No matching help
                                                                articles.
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : null}
                                                <Textarea
                                                    name="body"
                                                    required
                                                    value={replyBody}
                                                    onChange={(event) =>
                                                        setReplyBody(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        mode === 'note'
                                                            ? 'Private note'
                                                            : 'Type your message'
                                                    }
                                                    className="min-h-20"
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <Button
                                                        disabled={processing}
                                                    >
                                                        {mode === 'note'
                                                            ? 'Add note'
                                                            : replyLabel}
                                                    </Button>
                                                </div>
                                            </DeskGlass>
                                        )}
                                    </Form>
                                </div>
                            ) : (
                                <RecordSection title="Conversation">
                                    <div data-ticket="attach-thread">
                                        <p className="text-[13px] text-ink">
                                            Open WhatsApp / attach thread
                                        </p>
                                        <p className="mt-1 text-[12px] text-mute">
                                            A ticket needs a Desk thread, not an
                                            empty conversation. Contact is
                                            already {contactName}.
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Button asChild size="sm">
                                                <Link href="/inbox">
                                                    Open WhatsApp
                                                </Link>
                                            </Button>
                                        </div>
                                        {attachableThreads.length > 0 ? (
                                            <ul className="mt-4 space-y-2">
                                                {attachableThreads.map(
                                                    (row) => (
                                                        <li
                                                            key={row.id}
                                                            className="flex items-center justify-between gap-2 border-b border-hairline py-1.5"
                                                        >
                                                            <span className="truncate text-[13px] text-ink">
                                                                {row.subject ??
                                                                    `Thread ${row.id}`}
                                                            </span>
                                                            <Form
                                                                action={`/crm/tickets/${ticket.id}/thread`}
                                                                method="post"
                                                            >
                                                                <input
                                                                    type="hidden"
                                                                    name="thread_id"
                                                                    value={
                                                                        row.id
                                                                    }
                                                                />
                                                                <Button
                                                                    type="submit"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-[12px]"
                                                                >
                                                                    Attach
                                                                    thread
                                                                </Button>
                                                            </Form>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="mt-3 text-[12px] text-mute">
                                                No Desk thread on this contact
                                                yet.
                                            </p>
                                        )}
                                    </div>
                                </RecordSection>
                            )
                        }
                        right={
                            <div className="space-y-3">
                                <AskEvoPanel
                                    action={askAction}
                                    insight={askEvo}
                                />
                                <AssociationCard
                                    title="Contact"
                                    addHref={
                                        contact
                                            ? `/crm/contacts/${contact.id}`
                                            : '/crm/contacts'
                                    }
                                    addLabel="View"
                                >
                                    {contact ? (
                                        <RelatedRecordLink
                                            href={`/crm/contacts/${contact.id}`}
                                        >
                                            {contactName}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">
                                            Required contact missing
                                        </p>
                                    )}
                                </AssociationCard>
                                <AssociationCard
                                    title="Deal"
                                    addHref={
                                        deal
                                            ? `/crm/deals/${deal.id}`
                                            : contact
                                              ? `/crm/deals?create=1&contact_id=${contact.id}`
                                              : '/crm/deals?create=1'
                                    }
                                    addLabel={deal ? 'View' : 'Add'}
                                >
                                    {deal ? (
                                        <RelatedRecordLink
                                            href={`/crm/deals/${deal.id}`}
                                        >
                                            {deal.title}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">
                                            {t('No deal')}
                                        </p>
                                    )}
                                </AssociationCard>
                                {quotes.length > 0 ? (
                                    <AssociationCard title="Quotes">
                                        {quotes.map((quote) => (
                                            <p
                                                key={quote.id}
                                                className="text-[13px] text-ink"
                                            >
                                                Quote #{quote.id}
                                                {quote.status
                                                    ? ` · ${quote.status}`
                                                    : ''}
                                            </p>
                                        ))}
                                    </AssociationCard>
                                ) : null}
                                <AssociationCard
                                    title="Desk + WhatsApp"
                                    addHref={
                                        thread
                                            ? `/conversations?thread=${thread.id}`
                                            : '/inbox'
                                    }
                                    addLabel="Open"
                                >
                                    {thread ? (
                                        <RelatedRecordLink
                                            href={`/conversations?thread=${thread.id}`}
                                        >
                                            {thread.subject ?? 'Open thread'}
                                        </RelatedRecordLink>
                                    ) : (
                                        <p className="text-mute">
                                            Open WhatsApp / attach a Desk
                                            thread.
                                        </p>
                                    )}
                                </AssociationCard>
                            </div>
                        }
                    />
                </RecordPageFrame>
            )}
        </>
    );
}

TicketShow.layout = {
    breadcrumbs: [
        { title: 'Tickets', href: '/crm/tickets' },
        { title: 'Ticket', href: '#' },
    ],
};
