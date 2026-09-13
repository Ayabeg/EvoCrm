import { Form, Head } from '@inertiajs/react';
import { FilePdf, PaperPlaneTilt, Prohibit } from '@phosphor-icons/react';
import { SkeletonRecord } from '@/components/crm/empty-room';
import {
    AssociationCard,
    RecordBack,
    RecordShell,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordIdentity,
    RecordPageFrame,
    RecordSection,
    RecordStatusBadge,
} from '@/components/crm/record-hub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { formatDzd } from '@/lib/money';

type QuoteItem = {
    id?: number;
    name: string;
    quantity: number;
    unit_cents: number;
    total_cents: number;
};

type QuoteRecord = {
    id: number;
    title: string;
    status: string;
    status_label: string;
    currency: string;
    total_cents: number;
    notes?: string | null;
    created_at?: string | null;
    expires_at?: string | null;
    sent_at?: string | null;
    accepted_at?: string | null;
    revoked_at?: string | null;
    public_url?: string | null;
    immutable: boolean;
    owner?: { id: number; name: string } | null;
    deal?: { id: number; title: string } | null;
    contact?: {
        id: number;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
    company?: { id: number; name: string } | null;
    items: QuoteItem[];
};

function formatWhen(iso?: string | null): string | null {
    if (!iso) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Africa/Algiers',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export default function QuoteShow({ quote }: { quote: QuoteRecord }) {
    const loading = useInertiaLoading();
    const contactName = quote.contact
        ? `${quote.contact.first_name} ${quote.contact.last_name ?? ''}`.trim()
        : null;
    const items = quote.items ?? [];
    const sent = Boolean(quote.sent_at);
    const accepted = Boolean(quote.accepted_at);
    const revoked = Boolean(quote.revoked_at);

    return (
        <>
            <Head title={quote.title} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <div
                            className="flex items-center justify-between gap-3"
                            data-crm="quotes-record"
                        >
                            <RecordBack href="/crm/quotes" label="Back to Quotes" />
                        </div>
                    }
                >
                    <RecordShell
                        leftLabel="About"
                        centerLabel="Lines"
                        rightLabel="Related"
                        left={
                            <div className="space-y-4">
                                <RecordIdentity
                                    title={quote.title}
                                    kind={`Quote #${quote.id}`}
                                    subtitle={
                                        <>
                                            {contactName ?? 'No contact'}
                                            {quote.owner?.name
                                                ? ` · ${quote.owner.name}`
                                                : ''}
                                        </>
                                    }
                                    badge={
                                        <RecordStatusBadge>
                                            {quote.status_label}
                                        </RecordStatusBadge>
                                    }
                                />
                                <RecordSection title="About this quote">
                                    <RecordFactList>
                                        <RecordFact
                                            label="Amount"
                                            value={formatDzd(quote.total_cents)}
                                            money
                                            hideEmpty={false}
                                        />
                                        <RecordFact
                                            label="Status"
                                            value={quote.status_label}
                                            hideEmpty={false}
                                        />
                                        <RecordFact
                                            label="Owner"
                                            value={quote.owner?.name}
                                        />
                                        <RecordFact
                                            label="Created"
                                            value={formatWhen(quote.created_at)}
                                        />
                                        <RecordFact
                                            label="Expires"
                                            value={
                                                formatWhen(quote.expires_at) ??
                                                'No expiration'
                                            }
                                            hideEmpty={false}
                                        />
                                        <RecordFact
                                            label="Sent"
                                            value={formatWhen(quote.sent_at)}
                                        />
                                        <RecordFact
                                            label="Accepted"
                                            value={formatWhen(quote.accepted_at)}
                                        />
                                    </RecordFactList>
                                    {quote.notes ? (
                                        <p className="text-[13px] text-ink">{quote.notes}</p>
                                    ) : (
                                        <p className="text-[12px] text-mute">No notes.</p>
                                    )}
                                </RecordSection>
                            </div>
                        }
                        center={
                            <div className="space-y-4">
                                <RecordSection title="Line items">
                                    {items.length === 0 ? (
                                        <p className="text-[13px] text-mute">
                                            No line items
                                        </p>
                                    ) : (
                                        <table className="w-full border-collapse text-[13px]">
                                            <thead>
                                                <tr className="border-b border-hairline text-left text-[11px] text-mute">
                                                    <th className="py-1.5 font-medium">
                                                        Item
                                                    </th>
                                                    <th className="py-1.5 font-medium">
                                                        Qty
                                                    </th>
                                                    <th className="py-1.5 text-right font-medium">
                                                        Unit
                                                    </th>
                                                    <th className="py-1.5 text-right font-medium">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index) => (
                                                    <tr
                                                        key={item.id ?? index}
                                                        className="border-b border-hairline"
                                                    >
                                                        <td className="py-1.5 text-ink">
                                                            {item.name}
                                                        </td>
                                                        <td className="money py-1.5 text-mute">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="money py-1.5 text-right text-mute">
                                                            {formatDzd(item.unit_cents)}
                                                        </td>
                                                        <td className="money py-1.5 text-right text-ink">
                                                            {formatDzd(item.total_cents)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                    <p className="money text-right text-[15px] font-semibold text-ink">
                                        {formatDzd(quote.total_cents)}
                                    </p>
                                </RecordSection>
                                <RecordSection title="Delivery">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                        >
                                            <a
                                                href={`/crm/quotes/${quote.id}/preview`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <FilePdf className="size-3.5" />
                                                Preview PDF
                                            </a>
                                        </Button>
                                    </div>
                                    {accepted ? (
                                        <p className="text-[13px] text-ink">
                                            Accepted {formatWhen(quote.accepted_at)}.
                                        </p>
                                    ) : revoked ? (
                                        <p className="text-[13px] text-ink">
                                            This public link is revoked.
                                        </p>
                                    ) : (
                                        <Form
                                            action={`/crm/quotes/${quote.id}/send`}
                                            method="post"
                                            className="flex flex-wrap items-end gap-2"
                                        >
                                            {({ processing }) => (
                                                <>
                                                    <div className="min-w-[12rem] flex-1">
                                                        <label className="mb-1 block text-[11px] text-mute">
                                                            Customer email
                                                        </label>
                                                        <Input
                                                            name="to"
                                                            type="email"
                                                            defaultValue={
                                                                quote.contact?.email ??
                                                                ''
                                                            }
                                                            placeholder="Customer email"
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    <Button
                                                        disabled={processing}
                                                        size="sm"
                                                        className="h-8 bg-[var(--evosales-mark,#d9500f)] text-white hover:bg-[var(--evosales-mark-hover,#bf460d)]"
                                                    >
                                                        <PaperPlaneTilt className="size-3.5" />
                                                        {sent ? 'Resend quote' : 'Email quote'}
                                                    </Button>
                                                </>
                                            )}
                                        </Form>
                                    )}
                                    {sent && !accepted && !revoked ? (
                                        <Form
                                            action={`/crm/quotes/${quote.id}/revoke`}
                                            method="post"
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={processing}
                                                    className="h-8 text-mute"
                                                >
                                                    <Prohibit className="size-3.5" />
                                                    Revoke link
                                                </Button>
                                            )}
                                        </Form>
                                    ) : null}
                                    {quote.public_url ? (
                                        <p className="break-all text-[11px] text-mute">
                                            {quote.public_url}
                                        </p>
                                    ) : null}
                                </RecordSection>
                            </div>
                        }
                        right={
                            <div className="space-y-4">
                                <AssociationCard
                                    title="Deal"
                                    empty={quote.deal ? undefined : 'No deal linked'}
                                >
                                    {quote.deal ? (
                                        <RelatedRecordLink
                                            href={`/crm/deals/${quote.deal.id}`}
                                            meta={quote.status_label}
                                        >
                                            {quote.deal.title}
                                        </RelatedRecordLink>
                                    ) : null}
                                </AssociationCard>
                                <AssociationCard
                                    title="Contact"
                                    empty={quote.contact ? undefined : 'No contact linked'}
                                >
                                    {quote.contact ? (
                                        <RelatedRecordLink
                                            href={`/crm/contacts/${quote.contact.id}`}
                                            meta={quote.contact.email ?? undefined}
                                        >
                                            {contactName}
                                        </RelatedRecordLink>
                                    ) : null}
                                </AssociationCard>
                                <AssociationCard
                                    title="Company"
                                    empty={quote.company ? undefined : 'No company linked'}
                                >
                                    {quote.company ? (
                                        <RelatedRecordLink
                                            href={`/crm/companies/${quote.company.id}`}
                                        >
                                            {quote.company.name}
                                        </RelatedRecordLink>
                                    ) : null}
                                </AssociationCard>
                            </div>
                        }
                    />
                </RecordPageFrame>
            )}
        </>
    );
}

QuoteShow.layout = {
    breadcrumbs: [
        { title: 'Quotes', href: '/crm/quotes' },
        { title: 'Quote', href: '/crm/quotes' },
    ],
};
