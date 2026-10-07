import { Head } from '@inertiajs/react';
import { FilePdf } from '@phosphor-icons/react';
import { SkeletonRecord } from '@/components/crm/empty-room';
import { RecordBack } from '@/components/crm/record-chrome';
import { RecordStatusBadge } from '@/components/crm/record-hub';
import { RecordPageFrame } from '@/evo/crm/record';
import { Button } from '@/evo/ui/button';
import { WorkspaceHeader } from '@/evo/workspace/WorkspaceHeader';
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
                        <div data-crm="quotes-record">
                        <WorkspaceHeader
                            archetype="document"
                            dataCrm="quotes-record"
                            leading={
                                <RecordBack
                                    href={quoteListHref()}
                                    label="Back to Quotes"
                                />
                            }
                            title={quote.title}
                            status={
                                <RecordStatusBadge>
                                    {quote.status_label}
                                </RecordStatusBadge>
                            }
                            meta={
                                <span className="text-[11px] text-mute">
                                    {t('Quote #:id', { id: quote.id })}
                                </span>
                            }
                            count={
                                <>
                                    {contactName ?? t('No contact')}
                                    {quote.owner?.name
                                        ? ` · ${quote.owner.name}`
                                        : ''}
                                </>
                            }
                            secondaryActions={
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
                                        {t('Preview PDF')}
                                    </a>
                                </Button>
                            }
                        />
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
