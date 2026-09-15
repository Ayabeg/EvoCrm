import type { QuickRecordPeekPayload, RecordDescriptor } from '@/ds/workspace/quick-record/types';
import { adaptCompany } from '@/ds/workspace/record-adapters/company';
import { adaptContact } from '@/ds/workspace/record-adapters/contact';
import { adaptDeal } from '@/ds/workspace/record-adapters/deal';
import { adaptLead } from '@/ds/workspace/record-adapters/lead';
import { adaptQuote } from '@/ds/workspace/record-adapters/quote';

export function adaptRecord(payload: QuickRecordPeekPayload): RecordDescriptor {
    switch (payload.type) {
        case 'contact':
            return adaptContact(payload);
        case 'company':
            return adaptCompany(payload);
        case 'lead':
            return adaptLead(payload);
        case 'deal':
            return adaptDeal(payload);
        case 'quote':
            return adaptQuote(payload);
    }
}

export { adaptCompany, adaptContact, adaptDeal, adaptLead, adaptQuote };
