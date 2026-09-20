import { apiClient } from '@/services/api';
import type {
  ContactListResponse,
  ContactResponse,
  ContactWritePayload,
} from '@/types/contact';

export type ListContactsParams = {
  q?: string;
  page?: number;
  perPage?: number;
};

export async function listContacts(params: ListContactsParams = {}) {
  return apiClient.call<ContactListResponse>('contactsIndex', {}, {
    query: {
      q: params.q?.trim() ? params.q.trim() : undefined,
      page: params.page,
      per_page: params.perPage,
    },
  });
}

export async function getContact(id: number) {
  return apiClient.call<ContactResponse>('contactsShow', { id });
}

export async function createContact(body: ContactWritePayload) {
  return apiClient.call<ContactResponse>('contactsStore', {}, { body });
}

export async function updateContact(id: number, body: ContactWritePayload) {
  return apiClient.call<ContactResponse>('contactsUpdate', { id }, { body });
}
