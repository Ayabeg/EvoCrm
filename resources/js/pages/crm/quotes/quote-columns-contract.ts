import { formatDzd } from '@/lib/money';
import {
    applyQuoteColumnContract,
    quoteAmountLabel,
    quoteEmptyState,
    quoteIdentityPrimary,
    quoteIdentitySecondary,
    quoteInitials,
    quoteNumberLabel,
    quoteRowHref,
    quoteStatusLabel,
    quoteStatusTone,
} from '@/pages/crm/quotes/quote-columns';

/**
 * Runtime proofs for the P08 Quotes column / empty / rowHref contract.
 */

export const P08_ROW_HREF = quoteRowHref({ id: 42 });
export const P08_ROW_HREF_STRING = quoteRowHref({ id: 'uuid-row' });

export const P08_EMPTY = quoteEmptyState(false);
export const P08_FILTERED_EMPTY = quoteEmptyState(true);

export const P08_COLUMN_LABELS = applyQuoteColumnContract([
    { id: 'title', label: 'Quote', defaultVisible: true },
    { id: 'amount', label: 'Amount', defaultVisible: true },
    { id: 'status', label: 'Status', defaultVisible: true },
    { id: 'owner', label: 'Owner', defaultVisible: true },
    { id: 'created_at', label: 'Create date', defaultVisible: true },
    { id: 'expires_at', label: 'Expiration', defaultVisible: true },
    { id: 'sent_at', label: 'Sent', defaultVisible: false },
]);

export const P08_PRIMARY_DEAL = quoteIdentityPrimary({
    id: 7,
    title: 'Clinic landing page',
    status: 'draft',
});

export const P08_PRIMARY_FALLBACK = quoteIdentityPrimary({
    id: 7,
    title: '',
    status: 'draft',
});

export const P08_SECONDARY_DEAL = quoteIdentitySecondary({
    id: 7,
    title: 'Clinic landing page',
    status: 'draft',
});

export const P08_SECONDARY_NUMBER = quoteIdentitySecondary({
    id: 7,
    title: 'Quote #7',
    status: 'draft',
});

export const P08_NUMBER = quoteNumberLabel(7);
export const P08_INITIALS = quoteInitials('Clinic landing page');

export const P08_AMOUNT = quoteAmountLabel(500_000);
export const P08_AMOUNT_ZERO = quoteAmountLabel(0);
export const P08_AMOUNT_FORMAT = formatDzd(500_000);

export const P08_STATUS_DRAFT = quoteStatusTone('draft');
export const P08_STATUS_SENT = quoteStatusTone('sent');
export const P08_STATUS_ACCEPTED = quoteStatusTone('accepted');
export const P08_STATUS_UNKNOWN = quoteStatusTone('expired');
export const P08_STATUS_LABEL = quoteStatusLabel({
    status: 'sent',
    status_label: 'Sent',
});

if (P08_ROW_HREF !== '/crm/quotes/42') {
    throw new Error('quoteRowHref uses /crm/quotes/:id');
}

if (P08_ROW_HREF_STRING !== '/crm/quotes/uuid-row') {
    throw new Error('quoteRowHref keeps string ids');
}

if (P08_EMPTY.title !== 'No quotes yet' || !P08_EMPTY.actionLabel) {
    throw new Error('true empty state keeps create CTA');
}

if (P08_FILTERED_EMPTY.title !== 'No quotes match these filters' || P08_FILTERED_EMPTY.actionLabel) {
    throw new Error('filtered empty has no primary CTA');
}

if (P08_COLUMN_LABELS[0]?.label !== 'Quote' || P08_COLUMN_LABELS[2]?.label !== 'Status') {
    throw new Error('title relabels to Quote without inventing fields');
}

if (
    P08_PRIMARY_DEAL !== 'Clinic landing page' ||
    P08_PRIMARY_FALLBACK !== 'Quote #7' ||
    P08_SECONDARY_DEAL !== 'Quote #7' ||
    P08_SECONDARY_NUMBER !== null ||
    P08_NUMBER !== 'Quote #7'
) {
    throw new Error('identity is deal title with quote number secondary, never duplicated');
}

if (P08_INITIALS !== 'CL') {
    throw new Error('quote initials use the first two title tokens');
}

if (P08_AMOUNT !== P08_AMOUNT_FORMAT || P08_AMOUNT_ZERO !== formatDzd(0)) {
    throw new Error('amount uses existing formatDzd without conversion');
}

if (P08_STATUS_DRAFT !== 'draft' || P08_STATUS_SENT !== 'sent' || P08_STATUS_ACCEPTED !== 'accepted') {
    throw new Error('status tones are exact production statuses');
}

if (P08_STATUS_UNKNOWN !== 'unknown') {
    throw new Error('do not invent expired from a date-owned status');
}

if (P08_STATUS_LABEL !== 'Sent') {
    throw new Error('status labels stay the production labels');
}

export const P08_QUOTE_COLUMN_CONTRACT = {
    'rowHref is /crm/quotes/:id': true,
    'string row ids stay string': true,
    'true empty vs filtered empty': true,
    'title column relabels to Quote': true,
    'identity is deal title with quote number secondary': true,
    'amount uses existing formatDzd': true,
    'statuses are draft sent accepted': true,
    'do not invent expired status': true,
} as const;
