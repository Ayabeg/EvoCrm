import {
    applyLeadColumnContract,
    leadContactName,
    leadEmptyState,
    leadIdentitySecondary,
    leadInitials,
    leadRowHref,
    leadScorePayload,
} from '@/pages/crm/leads/lead-columns';

/**
 * Runtime proofs for the P06 Leads column / empty / rowHref contract.
 */

export const P06_ROW_HREF = leadRowHref({ id: 42 });
export const P06_ROW_HREF_STRING = leadRowHref({ id: 'uuid-row' });

export const P06_EMPTY = leadEmptyState(false);
export const P06_FILTERED_EMPTY = leadEmptyState(true);

export const P06_COLUMN_LABELS = applyLeadColumnContract([
    { id: 'title', label: 'Title', defaultVisible: true },
    { id: 'contact', label: 'Contact', defaultVisible: true },
    { id: 'status', label: 'Status', defaultVisible: true },
    { id: 'score', label: 'Score', defaultVisible: true },
]);

export const P06_SECONDARY = leadIdentitySecondary({
    id: 1,
    title: 'Clinic Atlas inbound',
    contact: { first_name: 'Amel', last_name: 'Hadj' },
});

export const P06_SECONDARY_NONE = leadIdentitySecondary({
    id: 2,
    title: 'Clinic Atlas inbound',
    contact: null,
});

export const P06_CONTACT_NAME = leadContactName({
    id: 3,
    title: 'Clinic Atlas inbound',
    contact: { first_name: 'Amel', last_name: 'Hadj' },
});

export const P06_INITIALS = leadInitials('Clinic Atlas inbound');

export const P06_SCORE = leadScorePayload({
    id: 4,
    title: 'Clinic Atlas inbound',
    score: 72,
    latest_score: { score: 60, reason: 'Fit and intent' },
});

export const P06_SCORE_DENORMALIZED = leadScorePayload({
    id: 5,
    title: 'Clinic Atlas inbound',
    score: 92,
    latest_score: null,
});

export const P06_SCORE_ZERO = leadScorePayload({
    id: 6,
    title: 'Clinic Atlas inbound',
    score: 0,
    latest_score: null,
});

export const P06_SCORE_NONE = leadScorePayload({
    id: 7,
    title: 'Clinic Atlas inbound',
    score: null,
    latest_score: null,
});

if (P06_ROW_HREF !== '/crm/leads/42') {
    throw new Error('leadRowHref uses /crm/leads/:id');
}

if (P06_ROW_HREF_STRING !== '/crm/leads/uuid-row') {
    throw new Error('leadRowHref keeps string ids');
}

if (P06_EMPTY.title !== 'No leads yet' || !P06_EMPTY.actionLabel) {
    throw new Error('true empty state keeps create CTA');
}

if (P06_FILTERED_EMPTY.title !== 'No leads match these filters' || P06_FILTERED_EMPTY.actionLabel) {
    throw new Error('filtered empty has no primary CTA');
}

if (P06_COLUMN_LABELS[0]?.label !== 'Lead' || P06_COLUMN_LABELS[1]?.label !== 'Contact') {
    throw new Error('title relabels to Lead without inventing fields');
}

if (P06_SECONDARY !== 'Amel Hadj' || P06_SECONDARY_NONE !== null || P06_CONTACT_NAME !== 'Amel Hadj') {
    throw new Error('identity secondary is the contact and never status or score');
}

if (P06_INITIALS !== 'CA') {
    throw new Error('lead initials use the first two title tokens');
}

if (P06_SCORE?.score !== 72 || P06_SCORE.reason !== 'Fit and intent') {
    throw new Error('score payload prefers denormalized score and latest_score reason');
}

if (P06_SCORE_DENORMALIZED?.score !== 92 || P06_SCORE_DENORMALIZED.reason !== undefined) {
    throw new Error('denormalized score without latest_score still surfaces');
}

if (P06_SCORE_ZERO?.score !== 0) {
    throw new Error('score 0 is a valid denormalized score');
}

if (P06_SCORE_NONE !== null) {
    throw new Error('score hides only when score and latest_score are both absent');
}

export const P06_LEAD_COLUMN_CONTRACT = {
    'rowHref is /crm/leads/:id': true,
    'string row ids stay string': true,
    'true empty vs filtered empty': true,
    'title column relabels to Lead': true,
    'identity secondary is contact': true,
    'denormalized score without latest_score still surfaces': true,
    'score 0 is a valid denormalized score': true,
} as const;
