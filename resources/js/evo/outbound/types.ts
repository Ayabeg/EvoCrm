export type OutboundStatus =
    | 'active'
    | 'warming'
    | 'disabled'
    | 'paused'
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'queued'
    | 'deferred'
    | 'failed'
    | 'verified'
    | 'pending'
    | 'finished'
    | 'received'
    | string;

export type CampaignCounts = {
    queued: number;
    deferred: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    replied: number;
    delivered?: number;
    complained?: number;
    bounced?: number;
};

export type CampaignRow = {
    id: number | string;
    name: string;
    status: string;
    subject?: string | null;
    scheduled_at?: string | null;
    sent_at?: string | null;
    audience_count: number;
    suppressed_count: number;
    created_at?: string;
    saved_filter?: { id: number | string; name: string } | null;
    template?: { id: number | string; name: string } | null;
    mailbox?: { id: number | string; name: string; from_address?: string } | null;
    counts: CampaignCounts;
};

export type CampaignDetail = CampaignRow & {
    body: string;
    started_at?: string | null;
    preview?: CampaignPreview | null;
};

export type CampaignPreview = {
    audience_count: number;
    eligible_count: number;
    ineligible_count: number;
    reasons: Record<string, number>;
    sample: {
        contact_id: number | string;
        email: string | null;
        eligible: boolean;
        reason: string | null;
        subject: string | null;
        body_preview: string;
    }[];
};

export type OutboundMessageRow = {
    id: number | string;
    direction?: string;
    channel?: string;
    to_address: string;
    subject?: string | null;
    status: string;
    failure_reason?: string | null;
    defer_reason?: string | null;
    deferred_until?: string | null;
    sent_at?: string | null;
    opened_at?: string | null;
    open_count?: number;
    clicked_at?: string | null;
    click_count?: number;
    replied_at?: string | null;
    created_at?: string;
    contact?: {
        id: number | string;
        first_name: string;
        last_name?: string | null;
        email?: string | null;
    } | null;
    mailbox?: { id: number | string; name: string; from_address?: string } | null;
    sequence?: { id: number | string; name: string } | null;
    campaign?: { id: number | string; name: string } | null;
};

export type SequenceRow = {
    id: number | string;
    name: string;
    channel: string;
    active: boolean;
    description?: string | null;
    steps?: { id: number | string }[];
    enrollments_count: number;
    enrollments_active: number;
    enrollments_paused: number;
    enrollments_finished: number;
};

export type SequenceStepRow = {
    id: number | string;
    position: number;
    delay_hours: number;
    channel: string;
    step_type?: string | null;
    mailbox_id?: number | null;
    subject?: string | null;
    subject_b?: string | null;
    body?: string | null;
    meeting_url?: string | null;
    wa_template_name?: string | null;
    wa_template_language?: string | null;
    mailbox?: { id: number | string; name: string } | null;
};

export type MailboxRow = {
    id: number | string;
    source?: string;
    name: string;
    from_name?: string;
    from_address: string;
    host?: string;
    port?: number;
    encryption?: string;
    username?: string;
    imap_host?: string | null;
    imap_port?: number | null;
    imap_encryption?: string | null;
    imap_username?: string | null;
    imap_configured?: boolean;
    is_default?: boolean;
    enabled?: boolean;
    status?: string;
    effective_status: string;
    daily_limit: number;
    sent_today: number;
    last_tested_at?: string | null;
    password_set?: boolean;
    imap_password_set?: boolean;
};

export type DomainChecklistItem = {
    key: string;
    label: string;
    type: string;
    host: string;
    value?: string | null;
    ready: boolean;
};

export type DomainRow = {
    id: number | string;
    domain: string;
    status: string;
    spf_record?: string | null;
    dkim_selector?: string | null;
    dkim_record?: string | null;
    dmarc_record?: string | null;
    notes?: string | null;
    verified_at?: string | null;
    checklist: DomainChecklistItem[];
};

export type TemplateRow = {
    id: number | string;
    name: string;
    subject?: string | null;
    body: string;
    body_html?: string | null;
    created_at?: string;
};

export type SuppressionRow = {
    id: number | string;
    type: string;
    value: string;
    reason?: string | null;
    source?: string | null;
};

export type AudienceListRow = {
    id: number | string;
    name: string;
    count: number;
    campaigns: Array<{ id: number | string; name: string; status: string }>;
};

export type WarmupMailbox = {
    id: number | string;
    name: string;
    from_name?: string;
    from_address: string;
    effective_status: string;
    is_system?: boolean;
    warming: boolean;
    day: number | null;
    cap: number;
    sent_today: number;
    remaining: number;
    ceiling: number;
    peers: boolean;
    fail_rate: number;
    next_cap: number | null;
};

export type OverviewStats = {
    mailboxes: number;
    mailboxes_enabled: number;
    sequences_active: number;
    enrolled_active: number;
    sent_30d: number;
    deferred: number;
    replies_30d: number;
    suppressed: number;
    failed_30d: number;
    delivered_30d?: number;
    complaints_30d?: number;
    campaigns_sending: number;
    campaigns_sent: number;
    domains: number;
    domains_verified: number;
};
