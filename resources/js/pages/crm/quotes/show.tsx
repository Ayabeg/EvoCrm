import { Head } from '@inertiajs/react';
import { FilePdf } from '@phosphor-icons/react';
import { SkeletonRecord } from '@/components/crm/empty-room';
import { RecordBack } from '@/components/crm/record-chrome';
import {
    RecordPageFrame,
    RecordStatusBadge,
} from '@/components/crm/record-hub';
import { Button } from '@/components/ui/button';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import { quoteListHref, quotePreviewHref } from '@/lib/quote-builder';
import type { QuoteRecord } from '@/pages/crm/quotes/quote-record';
import { QuoteSplitBuilder } from '@/pages/crm/quotes/quote-split-builder';

export default function QuoteShow({ quote }: { quote: QuoteRecord }) {
    const loading = useInertiaLoading();
    const contactName = quote.contact
        ? `${quote.contact.first_name} ${quote.contact.last_name ?? ''}`.trim()
        : null;

    return (
        <>
            <Head title={quote.title} />
            {loading ? (
                <SkeletonRecord />
            ) : (
                <RecordPageFrame
                    header={
                        <div
                            className="flex flex-wrap items-start justify-between gap-3"
                            data-crm="quotes-record"
                        >
                            <div className="min-w-0 space-y-1">
                                <RecordBack
                                    href={quoteListHref()}
                                    label="Back to Quotes"
                                />
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <h1 className="min-w-0 truncate text-record-title leading-snug font-semibold tracking-tight">
                                        {quote.title}
                                    </h1>
                                    <RecordStatusBadge>
                                        {quote.status_label}
                                    </RecordStatusBadge>
                                    <span className="text-[11px] text-mute">
                                        {t('Quote #:id', { id: quote.id })}
                                    </span>
                                </div>
                                <p className="text-[13px] text-mute">
                                    {contactName ?? t('No contact')}
                                    {quote.owner?.name
                                        ? ` · ${quote.owner.name}`
                                        : ''}
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0"
                            >
                                <a
                                    href={quotePreviewHref(quote.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FilePdf className="size-3.5" />
                                    Preview PDF
                                </a>
                            </Button>
                        </div>
                    }
                >
                    <QuoteSplitBuilder quote={quote} />
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
