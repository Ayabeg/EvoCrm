/** Contact shapes from ApiPayload::contact + ContactController. */

import type { PaginationMeta } from '@/types/api';

export type Contact = {
  id: number;
  first_name: string;
  last_name: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  phone_e164: string | null;
  city: string | null;
  wilaya: string | null;
  lead_status: string | null;
  company_id: number | null;
  company_name: string | null;
  owner_id: number | null;
  owner_name: string | null;
  source: string | null;
  last_activity_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ContactWritePayload = {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: number | null;
  owner_id?: number | null;
  city?: string | null;
  wilaya?: string | null;
  lead_status?: string | null;
};

export type ContactListResponse = {
  data: Contact[];
  meta: PaginationMeta;
};

export type ContactResponse = {
  data: Contact;
};
