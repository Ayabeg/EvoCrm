import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListShell } from '@/components/crm/crm-list-shell';
import { hasActiveListFilters } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInertiaLoading } from '@/hooks/use-inertia-loading';
import { t } from '@/lib/i18n';
import type { ListViewMeta, SavedView } from '@/lib/list-view-config';
import {
    quoteEmptyState,
    quoteRowHref,
} from '@/pages/crm/quotes/quote-columns';
import type { QuoteListRow } from '@/pages/crm/quotes/quote-columns';

type DealOption = { id: number; title: string };

export default function QuotesIndex({
    quotes,
    deals,
    members,
    savedFilters,
    activeFilters,
    listView,
    recordCount,
    paginator,
    createOpen,
}: {
    quotes: QuoteListRow[];
    deals: DealOption[];
    members: { id: number; name: string }[];
    savedFilters: SavedView[];
    activeFilters: Record<string, unknown>;
    listView: ListViewMeta;
    recordCount: number;
    paginator?: { page: number; per_page: number; total: number; last_page: number };
    createOpen?: boolean;
}) {
    const [drawer, setDrawer] = useState(Boolean(createOpen));
    const [dealId, setDealId] = useState(deals[0] ? String(deals[0].id) : '');
    const loading = useInertiaLoading();

    return (
        <>
            <Head title={t('Quotes')} />
            <div
                className="flex h-app-workspace min-h-0 flex-col bg-canvas-soft"
                data-crm="quotes-workspace"
            >
                <CrmListShell
                    resultMode="shared-table"
                    title="Quotes"
                    entity="quote"
                    basePath="/crm/quotes"
                    primaryLabel="Create quote"
                    onCreate={() => setDrawer(true)}
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    listView={listView}
                    recordCount={recordCount}
                    members={members}
                    className="bg-white"
                    contentClassName="bg-white"
                    rows={quotes}
                    rowHref={quoteRowHref}
                    empty={quoteEmptyState(hasActiveListFilters(activeFilters))}
                    paginator={paginator}
                    loading={loading}
                    selection={{
                        mode: 'uncontrolled',
                        // Page does not participate now. Not a permanent bulk ban.
                        selectable: false,
                        pageIds: quotes.map((quote) => quote.id),
                    }}
                />
            </div>

            <CreateDrawer
                open={drawer}
                onOpenChange={setDrawer}
                title="Create quote"
            >
                {deals.length === 0 ? (
                    <div className="space-y-3 text-[13px]">
                        <p className="text-ink">{t('A quote needs a deal first.')}</p>
                        <p className="text-mute">
                            {t('Open Deals, create the opportunity, then come back to price it.')}
                        </p>
                        <Link
                            href="/crm/deals?create=1"
                            className="inline-flex h-8 items-center text-[12px] font-medium text-ink underline-offset-2 hover:underline"
                        >
                            {t('Create a deal')}
                        </Link>
                    </div>
                ) : (
                    <Form
                        action={`/crm/deals/${dealId}/quotes`}
                        method="post"
                        className="space-y-3"
                        resetOnSuccess
                        onSuccess={() => setDrawer(false)}
                    >
                        {({ processing }) => (
                            <>
                                <div>
                                    <Label className="mb-1 block text-[12px]">
                                        {t('Deal')} <span className="text-brand">*</span>
                                    </Label>
                                    <select
                                        required
                                        value={dealId}
                                        onChange={(event) => setDealId(event.target.value)}
                                        className="h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm text-ink"
                                    >
                                        {deals.map((deal) => (
                                            <option key={deal.id} value={deal.id}>
                                                {deal.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="mb-1 block text-[12px]">
                                        {t('Line name')} <span className="text-brand">*</span>
                                    </Label>
                                    <Input name="items[0][name]" required maxLength={180} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="mb-1 block text-[12px]">
                                            {t('Quantity')}
                                        </Label>
                                        <Input
                                            name="items[0][quantity]"
                                            type="number"
                                            min={1}
                                            defaultValue={1}
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-1 block text-[12px]">
                                            {t('Amount (DZD)')}
                                        </Label>
                                        <Input
                                            name="items[0][unit_dzd]"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-1 block text-[12px]">{t('Notes')}</Label>
                                    <Input name="notes" />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setDrawer(false)}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button
                                        disabled={processing || !dealId}
                                        className="bg-brand text-white hover:bg-brand-hover"
                                    >
                                        {t('Create quote')}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </CreateDrawer>
        </>
    );
}

QuotesIndex.layout = {
    breadcrumbs: [{ title: 'Quotes', href: '/crm/quotes' }],
};
