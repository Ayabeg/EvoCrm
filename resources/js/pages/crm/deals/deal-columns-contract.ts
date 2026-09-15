import { formatDzd } from '@/lib/money';
import {
    applyDealColumnContract,
    dealAmountLabel,
    dealContactName,
    dealEmptyState,
    dealIdentitySecondary,
    dealInitials,
    dealRowHref,
    dealStageTone,
} from '@/pages/crm/deals/deal-columns';

/**
 * Runtime proofs for the P07 Deals column / empty / rowHref contract.
 */

export const P07_ROW_HREF = dealRowHref({ id: 42 });
export const P07_ROW_HREF_STRING = dealRowHref({ id: 'uuid-row' });

export const P07_EMPTY = dealEmptyState(false);
export const P07_FILTERED_EMPTY = dealEmptyState(true);

export const P07_COLUMN_LABELS = applyDealColumnContract([
    { id: 'title', label: 'Deal name', defaultVisible: true },
    { id: 'stage', label: 'Stage', defaultVisible: true },
    { id: 'amount', label: 'Amount', defaultVisible: true },
    { id: 'close_date', label: 'Close date', defaultVisible: true },
    { id: 'owner', label: 'Owner', defaultVisible: true },
    { id: 'company', label: 'Company', defaultVisible: true },
    { id: 'contact', label: 'Contact', defaultVisible: true },
]);

export const P07_SECONDARY_COMPANY = dealIdentitySecondary({
    id: 1,
    title: 'Clinic fit-out',
    company: { name: 'Clinic Atlas' },
    contact: { first_name: 'Amel', last_name: 'Hadj' },
});

export const P07_SECONDARY_CONTACT = dealIdentitySecondary({
    id: 2,
    title: 'Clinic fit-out',
    company: null,
    contact: { first_name: 'Amel', last_name: 'Hadj' },
});

export const P07_SECONDARY_NONE = dealIdentitySecondary({
    id: 3,
    title: 'Clinic fit-out',
    company: null,
    contact: null,
});

export const P07_CONTACT_NAME = dealContactName({
    id: 4,
    title: 'Clinic fit-out',
    contact: { first_name: 'Amel', last_name: 'Hadj' },
});

export const P07_INITIALS = dealInitials('Clinic Atlas inbound');

export const P07_AMOUNT = dealAmountLabel(65_000_000);
export const P07_AMOUNT_ZERO = dealAmountLabel(0);
export const P07_AMOUNT_FORMAT = formatDzd(65_000_000);

export const P07_STAGE_WON = dealStageTone({ name: 'Won', slug: 'won', is_won: true });
export const P07_STAGE_LOST = dealStageTone({ name: 'Lost', slug: 'lost', is_lost: true });
export const P07_STAGE_NEW = dealStageTone({ name: 'New', slug: 'new' });
export const P07_STAGE_QUALIFIED = dealStageTone({ name: 'Qualified', slug: 'qualified' });
export const P07_STAGE_DEMO = dealStageTone({ name: 'Demo', slug: 'demo' });
export const P07_STAGE_PROPOSAL = dealStageTone({ name: 'Proposal', slug: 'proposal' });

if (P07_ROW_HREF !== '/crm/deals/42') {
    throw new Error('dealRowHref uses /crm/deals/:id');
}

if (P07_ROW_HREF_STRING !== '/crm/deals/uuid-row') {
    throw new Error('dealRowHref keeps string ids');
}

if (P07_EMPTY.title !== 'No deals yet' || !P07_EMPTY.actionLabel) {
    throw new Error('true empty state keeps create CTA');
}

if (P07_FILTERED_EMPTY.title !== 'No deals match these filters' || P07_FILTERED_EMPTY.actionLabel) {
    throw new Error('filtered empty has no primary CTA');
}

if (P07_COLUMN_LABELS[0]?.label !== 'Deal' || P07_COLUMN_LABELS[1]?.label !== 'Stage') {
    throw new Error('title relabels to Deal without inventing fields');
}

if (
    P07_SECONDARY_COMPANY !== 'Clinic Atlas' ||
    P07_SECONDARY_CONTACT !== 'Amel Hadj' ||
    P07_SECONDARY_NONE !== null ||
    P07_CONTACT_NAME !== 'Amel Hadj'
) {
    throw new Error('identity secondary is company or contact, never both');
}

if (P07_INITIALS !== 'CA') {
    throw new Error('deal initials use the first two title tokens');
}

if (P07_AMOUNT !== P07_AMOUNT_FORMAT || P07_AMOUNT_ZERO !== formatDzd(0)) {
    throw new Error('amount uses existing formatDzd without conversion');
}

if (P07_STAGE_WON !== 'won' || P07_STAGE_LOST !== 'lost') {
    throw new Error('won is success and lost is quiet danger');
}

if (
    P07_STAGE_NEW !== 'open' ||
    P07_STAGE_QUALIFIED !== 'open' ||
    P07_STAGE_DEMO !== 'open' ||
    P07_STAGE_PROPOSAL !== 'open'
) {
    throw new Error('open stages stay mute and are not all orange');
}

export const P07_DEAL_COLUMN_CONTRACT = {
    'rowHref is /crm/deals/:id': true,
    'string row ids stay string': true,
    'true empty vs filtered empty': true,
    'title column relabels to Deal': true,
    'identity secondary is company else contact': true,
    'amount uses existing formatDzd': true,
    'won is success and lost is quiet danger': true,
    'open stages stay mute': true,
} as const;
