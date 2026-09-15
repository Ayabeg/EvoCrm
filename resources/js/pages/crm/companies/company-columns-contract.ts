import {
    applyCompanyColumnContract,
    companyEmptyState,
    companyIdentitySecondary,
    companyInitials,
    companyRowHref,
} from '@/pages/crm/companies/company-columns';

/**
 * Runtime proofs for the P05 Companies column / empty / rowHref contract.
 */

export const P05_ROW_HREF = companyRowHref({ id: 42 });
export const P05_ROW_HREF_STRING = companyRowHref({ id: 'uuid-row' });

export const P05_EMPTY = companyEmptyState(false);
export const P05_FILTERED_EMPTY = companyEmptyState(true);

export const P05_COLUMN_LABELS = applyCompanyColumnContract([
    { id: 'name', label: 'Name', defaultVisible: true },
    { id: 'city', label: 'City', defaultVisible: true },
    { id: 'wilaya', label: 'Wilaya', defaultVisible: true },
]);

export const P05_SECONDARY_BOTH = companyIdentitySecondary({
    id: 1,
    name: 'Clinic Atlas',
    city: 'Hydra',
    wilaya: 'Alger',
});

export const P05_SECONDARY_SAME = companyIdentitySecondary({
    id: 2,
    name: 'Oran Labs',
    city: 'Oran',
    wilaya: 'Oran',
});

export const P05_SECONDARY_CITY_ONLY = companyIdentitySecondary({
    id: 3,
    name: 'Clinic Atlas',
    city: 'Hydra',
    wilaya: null,
});

export const P05_SECONDARY_NONE = companyIdentitySecondary({
    id: 4,
    name: 'Clinic Atlas',
    city: null,
    wilaya: null,
});

export const P05_INITIALS = companyInitials('Clinic Atlas');

if (P05_ROW_HREF !== '/crm/companies/42') {
    throw new Error('companyRowHref uses /crm/companies/:id');
}

if (P05_ROW_HREF_STRING !== '/crm/companies/uuid-row') {
    throw new Error('companyRowHref keeps string ids');
}

if (P05_EMPTY.title !== 'No companies yet' || !P05_EMPTY.actionLabel) {
    throw new Error('true empty state keeps create CTA');
}

if (P05_FILTERED_EMPTY.title !== 'No companies match these filters' || P05_FILTERED_EMPTY.actionLabel) {
    throw new Error('filtered empty has no primary CTA');
}

if (P05_COLUMN_LABELS[0]?.label !== 'Company' || P05_COLUMN_LABELS[1]?.label !== 'City') {
    throw new Error('name relabels to Company without inventing fields');
}

if (
    P05_SECONDARY_BOTH !== 'Hydra · Alger' ||
    P05_SECONDARY_SAME !== 'Oran' ||
    P05_SECONDARY_CITY_ONLY !== 'Hydra' ||
    P05_SECONDARY_NONE !== null
) {
    throw new Error('identity secondary is compact location and never owner');
}

if (P05_INITIALS !== 'CA') {
    throw new Error('company initials use the first two name tokens');
}

export const P05_COMPANY_COLUMN_CONTRACT = {
    'rowHref is /crm/companies/:id': true,
    'string row ids stay string': true,
    'true empty vs filtered empty': true,
    'name column relabels to Company': true,
    'identity secondary is compact location': true,
} as const;
