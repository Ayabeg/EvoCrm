import { Form } from '@inertiajs/react';
import { PaperPlaneTilt, Prohibit } from '@phosphor-icons/react';
import { useState } from 'react';
import {
    AssociationCard,
    RelatedRecordLink,
} from '@/components/crm/record-chrome';
import {
    RecordFact,
    RecordFactList,
    RecordSection,
} from '@/components/crm/record-hub';
import { WorkspacePanelSwitcher } from '@/components/crm/adaptive-workspace-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    QUOTE_BUILDER_DESKTOP_GRID_CLASS,
    QUOTE_BUILDER_SPLIT_CLASS,
    QUOTE_DOCUMENT_PAPER_CLASS,
    formatQuoteWhen,
    quoteCanEdit,
    quoteDateInputValue,
    quoteRevokeAction,
    quoteSendAction,
    quoteUnitDzd,
    quoteUpdateAction,
} from '@/lib/quote-builder';
import { t } from '@/lib/i18n';
import { formatDzd } from '@/lib/money';
import type { QuoteRecord } from '@/pages/crm/quotes/quote-record';

export function QuoteSplitBuilder({ quote }: { quote: QuoteRecord }) {
    const [panel, setPanel] = useState<'left' | 'center' | 'right'>('center');
    const contactName = quote.contact
        ? `${quote.contact.first_name} ${quote.contact.last_name ?? ''}`.trim()
        : null;
    const items = quote.items ?? [];
    const editable = quoteCanEdit(quote.immutable);
    const sent = Boolean(quote.sent_at);
    const accepted = Boolean(quote.accepted_at);
    const revoked = Boolean(quote.revoked_at);
    const documentLines = editable && items.length === 0 ? [{ name: '', quantity: 1, unit_cents: 0 }] : items;

    const document = (
        <section
            aria-label={t('Document')}
            data-quote="document"
            className="min-h-0 flex-1 overflow-y-auto bg-canvas-soft px-4 py-4 sm:px-6 sm:py-6"
        >
            <div className={QUOTE_DOCUMENT_PAPER_CLASS}>
                <p className="text-[11px] font-semibold tracking-wide text-mute uppercase">
                    {t('Quote')}
                </p>
                <p className="mt-1 text-[12px] text-mute">{t('Quote #:id', { id: quote.id })}</p>
                <h2 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight text-ink">
                    {quote.title}
                </h2>
                <p className="mt-2 text-[13px] text-mute">
                    {contactName ?? t('No contact')}
                    {quote.company?.name ? ` · ${quote.company.name}` : ''}
                    {formatQuoteWhen(quote.expires_at)
                        ? ` · ${t('Expires')} ${formatQuoteWhen(quote.expires_at)}`
                        : ''}
                </p>
                {quote.immutable ? (
                    <p className="mt-3 text-[12px] text-mute">
                        {t('Sent quotes cannot be edited.')}
                    </p>
                ) : null}

                {editable ? (
                    <Form
                        action={quoteUpdateAction(quote.id)}
                        method="put"
                        className="mt-6 space-y-4"
                    >
                        {({ processing }) => (
                            <>
                                <LineTable
                                    items={documentLines}
                                    editable
                                />
                                <div className="flex justify-end">
                                    <Button
                                        disabled={processing}
                                        size="sm"
                                        className="h-8 bg-brand text-white hover:bg-brand-hover"
                                    >
                                        {t('Save lines')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                ) : (
                    <div className="mt-6">
                        <LineTable items={items} editable={false} />
                    </div>
                )}

                {quote.notes ? (
                    <p className="mt-6 text-[13px] text-ink">{quote.notes}</p>
                ) : (
                    <p className="mt-6 text-[12px] text-mute">{t('No notes.')}</p>
                )}

                <p className="money mt-6 text-right text-[20px] font-semibold tracking-tight text-ink">
                    {formatDzd(quote.total_cents)}
                </p>
            </div>
        </section>
    );

    const properties = (
        <aside
            aria-label={t('Properties')}
            data-quote="properties"
            className="min-h-0 overflow-y-auto bg-canvas px-4 py-4 md:px-5"
        >
            <div className="space-y-5">
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
                        <RecordFact label="Owner" value={quote.owner?.name} />
                        <RecordFact
                            label="Created"
                            value={formatQuoteWhen(quote.created_at)}
                        />
                        <RecordFact
                            label="Expires"
                            value={
                                formatQuoteWhen(quote.expires_at) ??
                                'No expiration'
                            }
                            hideEmpty={false}
                        />
                        <RecordFact
                            label="Sent"
                            value={formatQuoteWhen(quote.sent_at)}
                        />
                        <RecordFact
                            label="Accepted"
                            value={formatQuoteWhen(quote.accepted_at)}
                        />
                    </RecordFactList>
                </RecordSection>

                {editable ? (
                    <RecordSection title="Properties">
                        <Form
                            action={quoteUpdateAction(quote.id)}
                            method="put"
                            className="space-y-3"
                        >
                            {({ processing }) => (
                                <>
                                    <div>
                                        <Label
                                            htmlFor="quote-expires"
                                            className="mb-1 block text-[12px]"
                                        >
                                            {t('Expires')}
                                        </Label>
                                        <Input
                                            id="quote-expires"
                                            name="expires_at"
                                            type="date"
                                            defaultValue={quoteDateInputValue(
                                                quote.expires_at,
                                            )}
                                            className="h-8"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="quote-notes"
                                            className="mb-1 block text-[12px]"
                                        >
                                            {t('Notes')}
                                        </Label>
                                        <Textarea
                                            id="quote-notes"
                                            name="notes"
                                            defaultValue={quote.notes ?? ''}
                                            rows={3}
                                            className="text-[13px]"
                                        />
                                    </div>
                                    <Button
                                        disabled={processing}
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                    >
                                        {t('Save properties')}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </RecordSection>
                ) : null}

                <RecordSection title="Delivery">
                    <div data-quote="delivery" className="space-y-3">
                        {accepted ? (
                            <p className="text-[13px] text-ink">
                                {t('Accepted')} {formatQuoteWhen(quote.accepted_at)}.
                            </p>
                        ) : revoked ? (
                            <p className="text-[13px] text-ink">
                                {t('This public link is revoked.')}
                            </p>
                        ) : (
                            <Form
                                action={quoteSendAction(quote.id)}
                                method="post"
                                className="flex flex-wrap items-end gap-2"
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="min-w-[12rem] flex-1">
                                            <label
                                                htmlFor="quote-send-to"
                                                className="mb-1 block text-[11px] text-mute"
                                            >
                                                {t('Customer email')}
                                            </label>
                                            <Input
                                                id="quote-send-to"
                                                name="to"
                                                type="email"
                                                defaultValue={
                                                    quote.contact?.email ?? ''
                                                }
                                                placeholder="Customer email"
                                                className="h-8"
                                            />
                                        </div>
                                        <Button
                                            disabled={processing}
                                            size="sm"
                                            className="h-8 bg-brand text-white hover:bg-brand-hover"
                                        >
                                            <PaperPlaneTilt className="size-3.5" />
                                            {sent
                                                ? t('Resend quote')
                                                : t('Email quote')}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                        {sent && !accepted && !revoked ? (
                            <Form
                                action={quoteRevokeAction(quote.id)}
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
                                        {t('Revoke link')}
                                    </Button>
                                )}
                            </Form>
                        ) : null}
                        {quote.public_url ? (
                            <p className="break-all text-[11px] text-mute">
                                {quote.public_url}
                            </p>
                        ) : null}
                    </div>
                </RecordSection>

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
        </aside>
    );

    return (
        <div className={QUOTE_BUILDER_SPLIT_CLASS} data-quote="split-builder">
            <WorkspacePanelSwitcher
                panels={[
                    { key: 'center', label: 'Document' },
                    { key: 'left', label: 'Properties' },
                ]}
                active={panel}
                onChange={setPanel}
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
                {panel === 'left' ? properties : document}
            </div>
            <div className={QUOTE_BUILDER_DESKTOP_GRID_CLASS}>
                {document}
                {properties}
            </div>
        </div>
    );
}

function LineTable({
    items,
    editable,
}: {
    items: Array<{
        id?: number;
        name: string;
        quantity: number;
        unit_cents: number;
        total_cents?: number;
    }>;
    editable: boolean;
}) {
    if (!editable && items.length === 0) {
        return <p className="text-[13px] text-mute">{t('No line items')}</p>;
    }

    return (
        <table className="w-full border-collapse text-[13px]">
            <thead>
                <tr className="border-b border-hairline text-left text-[11px] text-mute">
                    <th className="py-1.5 font-medium">{t('Item')}</th>
                    <th className="py-1.5 font-medium">{t('Qty')}</th>
                    <th className="py-1.5 text-right font-medium">{t('Unit')}</th>
                    <th className="py-1.5 text-right font-medium">{t('Total')}</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={item.id ?? index} className="border-b border-hairline">
                        <td className="py-1.5 text-ink">
                            {editable ? (
                                <Input
                                    name={`items[${index}][name]`}
                                    defaultValue={item.name}
                                    required
                                    maxLength={180}
                                    className="h-8"
                                    aria-label={t('Line name')}
                                />
                            ) : (
                                item.name
                            )}
                        </td>
                        <td className="money py-1.5 text-mute">
                            {editable ? (
                                <Input
                                    name={`items[${index}][quantity]`}
                                    type="number"
                                    min={1}
                                    defaultValue={item.quantity}
                                    className="h-8 w-16"
                                    aria-label={t('Quantity')}
                                />
                            ) : (
                                item.quantity
                            )}
                        </td>
                        <td className="money py-1.5 text-right text-mute">
                            {editable ? (
                                <Input
                                    name={`items[${index}][unit_dzd]`}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    required
                                    defaultValue={quoteUnitDzd(item.unit_cents)}
                                    className="ml-auto h-8 w-28 text-right"
                                    aria-label={t('Amount (DZD)')}
                                />
                            ) : (
                                formatDzd(item.unit_cents)
                            )}
                        </td>
                        <td className="money py-1.5 text-right text-ink">
                            {formatDzd(
                                item.total_cents ??
                                    item.quantity * item.unit_cents,
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
