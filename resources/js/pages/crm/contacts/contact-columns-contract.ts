import {
    applyContactColumnContract,
    contactEmptyState,
    contactIdentitySecondary,
    contactRowHref,
} from '@/pages/crm/contacts/contact-columns';

/**
 * Runtime proofs for the P04 Contacts column / empty / rowHref contract.
 */

export const P04_ROW_HREF = contactRowHref({ id: 42 });
export const P04_ROW_HREF_STRING = contactRowHref({ id: 'uuid-row' });

export const P04_EMPTY = contactEmptyState(false);
export const P04_FILTERED_EMPTY = contactEmptyState(true);

export const P04_COLUMN_LABELS = applyContactColumnContract([
    { id: 'name', label: 'Name', defaultVisible: true },
    { id: 'email', label: 'Email', defaultVisible: true },
    { id: 'company', label: 'Company', defaultVisible: true },
]);

export const P04_SECONDARY_WITH_EMAIL = contactIdentitySecondary({
    id: 1,
    first_name: 'Amel',
    last_name: 'Hadj',
    email: 'amel@clinic.dz',
    company: { name: 'Clinic' },
});

export const P04_SECONDARY_COMPANY = contactIdentitySecondary({
    id: 2,
    first_name: 'Amel',
    last_name: 'Hadj',
    email: null,
    company: { name: 'Clinic' },
});

export const P04_SECONDARY_NO_COMPANY = contactIdentitySecondary({
    id: 3,
    first_name: 'Amel',
    last_name: 'Hadj',
    email: 'amel@clinic.dz',
    company: null,
});

if (P04_ROW_HREF !== '/crm/contacts/42') {
    throw new Error('contactRowHref uses /crm/contacts/:id');
}

if (P04_ROW_HREF_STRING !== '/crm/contacts/uuid-row') {
    throw new Error('contactRowHref keeps string ids');
}

if (P04_EMPTY.title !== 'No contacts yet' || !P04_EMPTY.actionLabel) {
    throw new Error('true empty state keeps create CTA');
}

if (P04_FILTERED_EMPTY.title !== 'No contacts match these filters' || P04_FILTERED_EMPTY.actionLabel) {
    throw new Error('filtered empty has no primary CTA');
}

if (P04_COLUMN_LABELS[0]?.label !== 'Contact' || P04_COLUMN_LABELS[1]?.label !== 'Email') {
    throw new Error('name relabels to Contact without inventing fields');
}

if (
    P04_SECONDARY_WITH_EMAIL !== 'Clinic' ||
    P04_SECONDARY_COMPANY !== 'Clinic' ||
    P04_SECONDARY_NO_COMPANY !== null
) {
    throw new Error('identity secondary is company only and never email');
}

export const P04_CONTACT_COLUMN_CONTRACT = {
    'rowHref is /crm/contacts/:id': true,
    'string row ids stay string': true,
    'true empty vs filtered empty': true,
    'name column relabels to Contact': true,
    'identity secondary is company only': true,
} as const;
