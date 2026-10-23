import { formatMoney, formatPhone } from '@/evo/lib/format';
import type {
    CampaignDetail,
    DomainRow,
    MailboxRow,
    OutboundMessageRow,
    SequenceStepRow,
    SuppressionRow,
    TemplateRow,
    WarmupMailbox,
} from '@/evo/outbound/types';
import { KNOWN_OBJECT_IDS } from './evocrm-demo-data';
import { getCompany, getContact, getOutboundSequences } from './selectors';

export const PHARMACIE_QUOTE_DZD = 1_280_000;

export function getPharmacieCentrale() {
    return getCompany(KNOWN_OBJECT_IDS.companyPharmacieCentrale);
}

export function getPharmacieContact() {
    return getContact(KNOWN_OBJECT_IDS.contactKarimMansouri);
}

export function getOutboundLabFixtures() {
    const company = getPharmacieCentrale();
    const karim = getPharmacieContact();
    const sequences = getOutboundSequences();
    const phone = formatPhone(karim.phone);
    const quote = formatMoney(PHARMACIE_QUOTE_DZD);

    const steps: SequenceStepRow[] = [
        {
            id: 'step-1',
            position: 1,
            delay_hours: 0,
            channel: 'email',
            step_type: 'email',
            subject: `EvoCrm pour ${company.name}`,
            subject_b: 'Un CRM pensé pour les pharmacies DZ',
            body: `Bonjour ${karim.firstName},\n\nNous accompagnons ${company.name} (${quote}).`,
        },
        {
            id: 'step-2',
            position: 2,
            delay_hours: 48,
            channel: 'whatsapp_cloud',
            step_type: 'whatsapp_cloud',
            wa_template_name: 'relance_pharmacie',
            wa_template_language: 'fr',
        },
        {
            id: 'step-3',
            position: 3,
            delay_hours: 72,
            channel: 'email',
            step_type: 'call',
            subject: `Appel ${company.name}`,
            body: `Joindre ${karim.firstName} au ${phone}.`,
        },
    ];

    const mailboxes: MailboxRow[] = [
        {
            id: 'box-1',
            name: 'Ventes · Alger',
            from_name: 'Sara Khelifi',
            from_address: 'sara@evotechly.dz',
            host: 'smtp.evotechly.dz',
            port: 587,
            encryption: 'tls',
            imap_configured: true,
            is_default: true,
            enabled: true,
            effective_status: 'active',
            daily_limit: 80,
            sent_today: 24,
            last_tested_at: '2026-09-30T09:15:00+01:00',
            source: 'mail_stack',
        },
        {
            id: 'box-2',
            name: 'Warmup · Oran',
            from_name: 'EvoCrm',
            from_address: 'warmup@evotechly.dz',
            host: 'smtp.evotechly.dz',
            port: 587,
            encryption: 'tls',
            imap_configured: true,
            effective_status: 'warming',
            daily_limit: 20,
            sent_today: 12,
            source: 'manual',
        },
    ];

    const campaign: CampaignDetail = {
        id: 'camp-pharmacie',
        name: `Newsletter ${company.name}`,
        status: 'sending',
        subject: `Solution CRM — ${quote}`,
        daily_limit: 20,
        audience_count: 48,
        suppressed_count: 2,
        body: `Bonjour {{first_name}}, proposition ${quote} pour ${company.name}.`,
        saved_filter: { id: 'list-pharmacies', name: 'Pharmacies Alger' },
        mailbox: { id: 'box-1', name: 'Ventes · Alger', from_address: 'sara@evotechly.dz' },
        counts: {
            queued: 6,
            deferred: 2,
            sent: 38,
            failed: 1,
            opened: 19,
            clicked: 7,
            replied: 4,
        },
    };

    const messages: OutboundMessageRow[] = [
        {
            id: 'msg-1',
            direction: 'out',
            channel: 'email',
            to_address: karim.email,
            subject: campaign.subject,
            status: 'sent',
            sent_at: '2026-09-30T10:15:00+01:00',
            opened_at: '2026-09-30T11:02:00+01:00',
            open_count: 2,
            contact: {
                id: karim.id,
                first_name: karim.firstName,
                last_name: karim.lastName,
                email: karim.email,
            },
            mailbox: { id: 'box-1', name: 'Ventes · Alger' },
            campaign: { id: campaign.id, name: campaign.name },
        },
        {
            id: 'msg-2',
            direction: 'out',
            channel: 'email',
            to_address: karim.email,
            subject: steps[0].subject,
            status: 'queued',
            contact: {
                id: karim.id,
                first_name: karim.firstName,
                last_name: karim.lastName,
                email: karim.email,
            },
            sequence: { id: 'seq-pharmacie', name: `Relance ${company.name}` },
        },
    ];

    const domains: DomainRow[] = [
        {
            id: 'dom-1',
            domain: 'evotechly.dz',
            status: 'verified',
            verified_at: '2026-09-12T08:00:00+01:00',
            spf_record: 'v=spf1 include:_spf.evotechly.dz ~all',
            dkim_selector: 'mail',
            dkim_record: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A',
            dmarc_record: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@evotechly.dz',
            checklist: [
                {
                    key: 'spf',
                    label: 'SPF',
                    type: 'TXT',
                    host: '@',
                    value: 'v=spf1 include:_spf.evotechly.dz ~all',
                    ready: true,
                },
                {
                    key: 'dkim',
                    label: 'DKIM',
                    type: 'TXT',
                    host: 'mail._domainkey',
                    value: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A',
                    ready: true,
                },
                {
                    key: 'dmarc',
                    label: 'DMARC',
                    type: 'TXT',
                    host: '_dmarc',
                    value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@evotechly.dz',
                    ready: true,
                },
            ],
        },
    ];

    const templates: TemplateRow[] = [
        {
            id: 'tpl-1',
            name: `Intro ${company.name}`,
            subject: `EvoCrm pour ${company.name}`,
            body: `Bonjour {{first_name}}, proposition ${quote}.`,
            body_html: `<p>Bonjour {{first_name}}, proposition ${quote}.</p>`,
            created_at: '2026-09-08T09:00:00+01:00',
        },
    ];

    const warmup: WarmupMailbox[] = [
        {
            id: 'box-2',
            name: 'Warmup · Oran',
            from_name: 'EvoCrm',
            from_address: 'warmup@evotechly.dz',
            effective_status: 'warming',
            warming: true,
            day: 3,
            cap: 20,
            sent_today: 12,
            remaining: 8,
            ceiling: 50,
            peers: true,
            fail_rate: 1.2,
            next_cap: 30,
        },
    ];

    const suppressions: SuppressionRow[] = [
        {
            id: 'sup-1',
            type: 'email',
            value: 'stop@pharmacie-centrale.dz',
            reason: 'unsubscribe',
            source: 'public',
        },
        {
            id: 'sup-2',
            type: 'phone',
            value: '+213555000111',
            reason: 'manual',
            source: 'manual',
        },
    ];

    return {
        company,
        karim,
        phone,
        quote,
        sequences,
        steps,
        mailboxes,
        campaign,
        campaigns: [campaign],
        messages,
        domains,
        templates,
        warmup,
        suppressions,
        stats: {
            mailboxes: 2,
            mailboxes_enabled: 2,
            sequences_active: sequences.filter((row) => row.status === 'active').length,
            enrolled_active: sequences.reduce((sum, row) => sum + row.enrolledContactIds.length, 0),
            sent_30d: 128,
            deferred: 6,
            replies_30d: 14,
            suppressed: 2,
            failed_30d: 3,
            campaigns_sending: 1,
            campaigns_sent: 4,
            domains: 1,
            domains_verified: 1,
        },
        mailStack: {
            configured: true,
            smtp_host: 'smtp.evotechly.dz',
            smtp_port: 587,
            imap_host: 'imap.evotechly.dz',
            imap_port: 993,
            roundcube_url: 'https://mail.evotechly.dz',
        },
        reports: {
            totals: { sent: 128, opened: 61, replied: 14, failed: 3 },
            perSequence: sequences.map((row) => ({
                id: row.id,
                name: row.name,
                enrollments: row.enrolledContactIds.length,
                sent: row.sent,
                opened: Math.round(row.sent * 0.4),
                replied: row.replies,
            })),
            perCampaign: [
                {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    audience_count: campaign.audience_count,
                    sent: campaign.counts.sent,
                    opened: campaign.counts.opened,
                    replied: campaign.counts.replied,
                },
            ],
            daily: [
                { day: '2026-09-27', sent: 18, opened: 7 },
                { day: '2026-09-28', sent: 22, opened: 11 },
                { day: '2026-09-29', sent: 31, opened: 14 },
                { day: '2026-09-30', sent: 28, opened: 16 },
                { day: '2026-10-01', sent: 29, opened: 13 },
            ],
        },
    };
}
