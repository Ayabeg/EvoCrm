import { Form, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { OutboundShell } from '@/components/crm/outbound-shell';
import type { CRMContextRecord } from '@/evo/crm/record';
import { InboxWorkspace } from '@/evo/inbox';
import { outboundReplyToConversation } from '@/evo/inbox/adapters';
import { Button } from '@/evo/ui/button';
import { Status } from '@/evo/ui/status';
import { t } from '@/lib/i18n';

type Lead = { id: number; title: string; status: string };
type Reply = {
    id: number;
    subject?: string | null;
    body?: string | null;
    created_at: string;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
        leads?: Lead[];
    } | null;
    mailbox?: { id: number; name: string } | null;
    parent?: { id: number; subject?: string | null; body?: string | null; sent_at?: string | null } | null;
};

function primaryLead(contact: NonNullable<Reply['contact']>): Lead | null {
    if (!contact.leads?.length) {
        return null;
    }

    return contact.leads.find((lead) => lead.status !== 'qualified') ?? contact.leads[0] ?? null;
}

function replyContext(reply: Reply): CRMContextRecord | null {
    if (!reply.contact) {
        return null;
    }

    const lead = primaryLead(reply.contact);
    const name = `${reply.contact.first_name} ${reply.contact.last_name ?? ''}`.trim();

    return {
        ref: { type: 'contact', id: reply.contact.id },
        title: name,
        subtitle: reply.contact.email ?? undefined,
        status: lead
            ? {
                  label: lead.status === 'qualified' ? t('Qualified') : lead.title,
                  tone: lead.status === 'qualified' ? 'success' : 'neutral',
              }
            : undefined,
        fullRecordHref: `/crm/contacts/${reply.contact.id}`,
        keyProperties: [
            { id: 'email', label: t('Email'), value: reply.contact.email ?? null },
            { id: 'subject', label: t('Subject'), value: reply.subject ?? null },
            {
                id: 'lead',
                label: t('Lead'),
                value: lead?.title ?? null,
                href: lead ? `/crm/leads/${lead.id}` : undefined,
            },
        ],
        associations: lead
            ? [{ ref: { type: 'lead', id: lead.id }, label: lead.title }]
            : [],
    };
}

export default function Replies({
    replies,
    imapNote,
}: {
    replies: Reply[];
    imapNote: string;
}) {
    const conversations = useMemo(
        () => replies.map(outboundReplyToConversation),
        [replies],
    );
    const [selectedId, setSelectedId] = useState<string | number | null>(
        conversations[0]?.id ?? null,
    );
    const selectedReply = replies.find((row) => String(row.id) === String(selectedId)) ?? null;
    const lead = selectedReply?.contact ? primaryLead(selectedReply.contact) : null;

    return (
        <OutboundShell title={t('Replies')}>
            <div className="flex h-full min-h-0 flex-col">
                <p className="border-b border-[var(--evo-hairline)] px-4 py-2 text-[12px] text-[var(--evo-ink-muted)]">
                    {t(imapNote)}
                </p>
                <InboxWorkspace
                    conversations={conversations}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    context={selectedReply ? replyContext(selectedReply) : null}
                    allowResolve={false}
                    empty={{
                        title: t('Replies'),
                        description: t(imapNote),
                    }}
                    headerExtra={
                        lead ? (
                            lead.status !== 'qualified' ? (
                                <Form
                                    action={`/crm/leads/${lead.id}/qualify`}
                                    method="post"
                                    options={{ preserveScroll: true }}
                                >
                                    <Button type="submit" variant="outline" size="sm">
                                        {t('Qualify')}
                                    </Button>
                                </Form>
                            ) : (
                                <Status tone="success" label={t('Qualified')} />
                            )
                        ) : null
                    }
                    onCompose={() => {
                        if (selectedReply?.contact) {
                            router.visit(`/crm/contacts/${selectedReply.contact.id}`);
                        }
                    }}
                />
            </div>
        </OutboundShell>
    );
}

Replies.layout = { breadcrumbs: [{ title: t('Replies'), href: '/outbound/replies' }] };
