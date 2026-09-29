/**
 * One-shot generator for evocrm-demo-data.ts.
 * Run: node resources/design-lab/data/_generate-demo-data.mjs
 * The committed .ts file is the source of truth; this script only authors it.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

function largestRemainder(total, weights) {
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => (w / weightSum) * total);
    const floors = raw.map((n) => Math.floor(n));
    let leftover = total - floors.reduce((a, b) => a + b, 0);
    const order = raw
        .map((n, i) => ({ i, frac: n - floors[i] }))
        .sort((a, b) => b.frac - a.frac);

    for (let k = 0; k < leftover; k += 1) {
        floors[order[k % order.length].i] += 1;
    }

    return floors;
}

function weekdayWeight(isoDate) {
    const day = new Date(`${isoDate}T12:00:00+01:00`).getUTCDay();
    if (day === 5 || day === 6) {
        return 0.35;
    }
    if (day === 0) {
        return 0.55;
    }
    return 1;
}

const DAYS = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
const dayWeights = DAYS.map(weekdayWeight);

const CAMPAIGNS = [
    {
        id: 'campaign-wa-cliniques-alger',
        name: 'WA Cliniques Alger',
        channel: 'whatsapp',
        spend: 180000,
        leads: 42,
        deals: 9,
        attributedRevenue: 432000,
        impressions: 78000,
        clicks: 1766,
    },
    {
        id: 'campaign-devis-crm-sante',
        name: 'Devis CRM Santé',
        channel: 'site_web',
        spend: 140000,
        leads: 28,
        deals: 6,
        attributedRevenue: 252000,
        impressions: 60667,
        clicks: 1373,
    },
    {
        id: 'campaign-retargeting-devis',
        name: 'Retargeting Devis',
        channel: 'instagram',
        spend: 70000,
        leads: 12,
        deals: 3,
        attributedRevenue: 112000,
        impressions: 30333,
        clicks: 687,
    },
    {
        id: 'campaign-prospecting-oran',
        name: 'Prospecting Oran',
        channel: 'autres',
        spend: 30000,
        leads: 4,
        deals: 1,
        attributedRevenue: 24000,
        impressions: 13000,
        clicks: 294,
    },
];

const FIRST = [
    'Yanis', 'Nour', 'Bilal', 'Ines', 'Sofiane', 'Yasmine', 'Riad', 'Amina',
    'Walid', 'Soraya', 'Mehdi', 'Lila', 'Adel', 'Hana', 'Nabil', 'Sara',
    'Farid', 'Meriem', 'Tarek', 'Dounia', 'Anis', 'Kahina', 'Reda', 'Imane',
    'Hakim', 'Nadia', 'Lotfi', 'Salima', 'Youcef', 'Fella', 'Karim', 'Rania',
    'Omar', 'Celine', 'Mounir', 'Wafa', 'Samy', 'Leila', 'Bilel', 'Asma',
    'Nassim', 'Hayat', 'Zakaria', 'Sihem', 'Amine', 'Lina', 'Samir', 'Karim',
];
const LAST = [
    'Boudiaf', 'Khelifi', 'Rahal', 'Ziani', 'Messaoudi', 'Bouaziz', 'Cherif',
    'Hamdi', 'Saadi', 'Touati', 'Belaid', 'Gherbi', 'Ait Ali', 'Benkhaled',
    'Djebbar', 'Oussedik', 'Lounis', 'Mokrani', 'Benyahia', 'Kaci', 'Taleb',
    'Ouadah', 'Mansouri', 'Belkacem', 'Haddad', 'Benali', 'Amrani', 'Ibrahim',
];

function person(i, prefix) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    return {
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, '')}.${prefix}@mail.dz`,
        phone: `+213 5${String(50 + (i % 40)).padStart(2, '0')} ${String(100 + i).padStart(3, '0')} ${String(10 + (i % 90)).padStart(2, '0')}`,
    };
}

const OWNERS = [
    { id: 'owner-eo', initials: 'EO', name: 'Elias Ouadah' },
    { id: 'owner-rc', initials: 'RC', name: 'Rania Cherif' },
    { id: 'owner-mt', initials: 'MT', name: 'Mehdi Taleb' },
    { id: 'owner-sk', initials: 'SK', name: 'Sofia Kaci' },
];

const ownerAt = (i) => OWNERS[i % OWNERS.length];

const namedCompanies = [
    {
        id: 'company-clinique-el-djazair',
        name: 'Clinique El Djazair',
        city: 'Alger',
        sector: 'Clinique',
        domain: 'clinique-djazair.dz',
    },
    {
        id: 'company-hopital-ibn-sina',
        name: 'Hôpital Ibn Sina',
        city: 'Alger',
        sector: 'Hôpital',
        domain: 'ibn-sina.dz',
    },
    {
        id: 'company-cabinet-dr-amrani',
        name: 'Cabinet Dr. Amrani',
        city: 'Blida',
        sector: 'Cabinet',
        domain: 'cabinet-amrani.dz',
    },
    {
        id: 'company-pharmacie-centrale',
        name: 'Pharmacie Centrale',
        city: 'Alger',
        sector: 'Pharmacie',
        domain: 'pharmacie-centrale.dz',
    },
    {
        id: 'company-clinique-el-yasmin',
        name: 'Clinique El Yasmin',
        city: 'Alger',
        sector: 'Clinique',
        domain: 'clinique-yasmin.dz',
    },
    {
        id: 'company-groupe-sante-atlas',
        name: 'Groupe Santé Atlas',
        city: 'Oran',
        sector: 'Groupe hospitalier',
        domain: 'sante-atlas.dz',
    },
    {
        id: 'company-labo-ibn-rochd',
        name: 'Laboratoire Ibn Rochd',
        city: 'Constantine',
        sector: 'Laboratoire',
        domain: 'ibn-rochd-lab.dz',
    },
];

const extraCompanySeeds = [
    ['Clinique El Wafa', 'Oran', 'Clinique'],
    ['Cabinet Dr. Boudiaf', 'Sétif', 'Cabinet'],
    ['Pharmacie El Amel', 'Tizi Ouzou', 'Pharmacie'],
    ['Polyclinique El Hidhab', 'Alger', 'Clinique'],
    ['Centre Dentaire Lumière', 'Oran', 'Cabinet'],
    ['Clinique El Amel', 'Annaba', 'Clinique'],
    ['Laboratoire El Hikma', 'Blida', 'Laboratoire'],
    ['Cabinet Dr. Ziani', 'Béjaïa', 'Cabinet'],
    ['Pharmacie Ibn Khaldoun', 'Constantine', 'Pharmacie'],
    ['Clinique El Nour', 'Alger', 'Clinique'],
    ['Hôpital El Massira', 'Oran', 'Hôpital'],
    ['Cabinet Dr. Hamdi', 'Tlemcen', 'Cabinet'],
    ['Clinique El Qods', 'Alger', 'Clinique'],
    ['Centre Médical Atlas', 'Sétif', 'Clinique'],
    ['Pharmacie El Feth', 'Alger', 'Pharmacie'],
    ['Cabinet Dr. Saadi', 'Oran', 'Cabinet'],
    ['Clinique El Rahma', 'Constantine', 'Clinique'],
    ['Polyclinique El Bassatine', 'Blida', 'Clinique'],
    ['Laboratoire El Chifa', 'Alger', 'Laboratoire'],
    ['Cabinet Dr. Touati', 'Annaba', 'Cabinet'],
    ['Clinique El Hayat', 'Oran', 'Clinique'],
    ['Pharmacie El Hikmat', 'Sétif', 'Pharmacie'],
    ['Centre Ophtalmo El Nour', 'Alger', 'Cabinet'],
    ['Clinique El Baraka', 'Tizi Ouzou', 'Clinique'],
    ['Hôpital El Farabi', 'Constantine', 'Hôpital'],
    ['Cabinet Dr. Gherbi', 'Oran', 'Cabinet'],
    ['Clinique El Ikhlas', 'Alger', 'Clinique'],
    ['Pharmacie El Quds', 'Blida', 'Pharmacie'],
    ['Laboratoire El Amal', 'Oran', 'Laboratoire'],
    ['Cabinet Dr. Lounis', 'Alger', 'Cabinet'],
    ['Clinique El Massara', 'Annaba', 'Clinique'],
    ['Polyclinique El Andalous', 'Oran', 'Clinique'],
    ['Centre Cardio El Djazair', 'Alger', 'Clinique'],
    ['Cabinet Dr. Mokrani', 'Constantine', 'Cabinet'],
    ['Clinique El Houda', 'Sétif', 'Clinique'],
];

const extraCompanies = extraCompanySeeds.map((seed, i) => {
    const [name, city, sector] = seed;
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return {
        id: `company-${slug}`,
        name,
        city,
        sector,
        domain: `${slug}.dz`,
    };
});

const companies = [...namedCompanies, ...extraCompanies];

const namedContacts = [
    {
        id: 'contact-amine-benali',
        firstName: 'Amine',
        lastName: 'Benali',
        email: 'amine.benali@clinique-djazair.dz',
        phone: '+213 555 120 447',
        companyId: 'company-clinique-el-djazair',
        ownerId: 'owner-eo',
        source: 'whatsapp',
        sourceCampaignId: 'campaign-wa-cliniques-alger',
        createdAt: '2026-09-03',
        title: 'Directeur administratif',
        city: 'Alger',
    },
    {
        id: 'contact-lina-haddad',
        firstName: 'Lina',
        lastName: 'Haddad',
        email: 'lina.haddad@ibn-sina.dz',
        phone: '+213 555 221 810',
        companyId: 'company-hopital-ibn-sina',
        ownerId: 'owner-rc',
        source: 'recommandation',
        sourceCampaignId: null,
        createdAt: '2026-09-04',
        title: 'Responsable SI',
        city: 'Alger',
    },
    {
        id: 'contact-samir-belkacem',
        firstName: 'Samir',
        lastName: 'Belkacem',
        email: 'samir.belkacem@cabinet-amrani.dz',
        phone: '+213 555 334 092',
        companyId: 'company-cabinet-dr-amrani',
        ownerId: 'owner-mt',
        source: 'email',
        sourceCampaignId: null,
        createdAt: '2026-09-05',
        title: 'Gérant',
        city: 'Blida',
    },
    {
        id: 'contact-karim-mansouri',
        firstName: 'Karim',
        lastName: 'Mansouri',
        email: 'karim.mansouri@pharmacie-centrale.dz',
        phone: '+213 555 448 671',
        companyId: 'company-pharmacie-centrale',
        ownerId: 'owner-sk',
        source: 'instagram',
        sourceCampaignId: null,
        createdAt: '2026-09-06',
        title: 'Pharmacien titulaire',
        city: 'Alger',
    },
];

const wonContacts = [
    {
        id: 'contact-nadia-khelifi',
        firstName: 'Nadia',
        lastName: 'Khelifi',
        email: 'nadia.khelifi@clinique-yasmin.dz',
        phone: '+213 555 501 220',
        companyId: 'company-clinique-el-yasmin',
        ownerId: 'owner-eo',
        source: 'recommandation',
        sourceCampaignId: null,
        createdAt: '2026-09-02',
        title: 'Directrice générale',
        city: 'Alger',
    },
    {
        id: 'contact-youcef-rahali',
        firstName: 'Youcef',
        lastName: 'Rahali',
        email: 'youcef.rahali@sante-atlas.dz',
        phone: '+213 555 612 903',
        companyId: 'company-groupe-sante-atlas',
        ownerId: 'owner-rc',
        source: 'email',
        sourceCampaignId: null,
        createdAt: '2026-09-07',
        title: 'Directeur commercial',
        city: 'Oran',
    },
    {
        id: 'contact-imane-boudiaf',
        firstName: 'Imane',
        lastName: 'Boudiaf',
        email: 'imane.boudiaf@ibn-rochd-lab.dz',
        phone: '+213 555 773 441',
        companyId: 'company-labo-ibn-rochd',
        ownerId: 'owner-mt',
        source: 'instagram',
        sourceCampaignId: null,
        createdAt: '2026-09-08',
        title: 'Responsable qualité',
        city: 'Constantine',
    },
];

const deals = [
    {
        id: 'deal-modernisation-crm',
        name: 'Modernisation CRM',
        companyId: 'company-clinique-el-djazair',
        contactId: 'contact-amine-benali',
        value: 320000,
        stage: 'qualification',
        status: 'open',
        ownerId: 'owner-eo',
        source: 'whatsapp',
        sourceCampaignId: 'campaign-wa-cliniques-alger',
        quoteId: 'quote-dv-2026-0047',
        createdAt: '2026-09-03',
        closedAt: null,
        wonAt: null,
    },
    {
        id: 'deal-crm-support',
        name: 'CRM & Support',
        companyId: 'company-hopital-ibn-sina',
        contactId: 'contact-lina-haddad',
        value: 540000,
        stage: 'negociation',
        status: 'open',
        ownerId: 'owner-rc',
        source: 'recommandation',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0051',
        createdAt: '2026-09-04',
        closedAt: null,
        wonAt: null,
    },
    {
        id: 'deal-digitalisation',
        name: 'Digitalisation',
        companyId: 'company-cabinet-dr-amrani',
        contactId: 'contact-samir-belkacem',
        value: 280000,
        stage: 'proposition',
        status: 'open',
        ownerId: 'owner-mt',
        source: 'email',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0054',
        createdAt: '2026-09-05',
        closedAt: null,
        wonAt: null,
    },
    {
        id: 'deal-solution-commerciale',
        name: 'Solution commerciale',
        companyId: 'company-pharmacie-centrale',
        contactId: 'contact-karim-mansouri',
        value: 150000,
        stage: 'negociation',
        status: 'open',
        ownerId: 'owner-sk',
        source: 'instagram',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0058',
        createdAt: '2026-09-06',
        closedAt: null,
        wonAt: null,
    },
    {
        id: 'deal-deploiement-national',
        name: 'Déploiement CRM national',
        companyId: 'company-clinique-el-yasmin',
        contactId: 'contact-nadia-khelifi',
        value: 620000,
        stage: 'gagne',
        status: 'won',
        ownerId: 'owner-eo',
        source: 'recommandation',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0031',
        createdAt: '2026-09-02',
        closedAt: '2026-09-11',
        wonAt: '2026-09-11',
    },
    {
        id: 'deal-plateforme-commerciale',
        name: 'Plateforme commerciale',
        companyId: 'company-groupe-sante-atlas',
        contactId: 'contact-youcef-rahali',
        value: 460000,
        stage: 'gagne',
        status: 'won',
        ownerId: 'owner-rc',
        source: 'email',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0038',
        createdAt: '2026-09-07',
        closedAt: '2026-09-18',
        wonAt: '2026-09-18',
    },
    {
        id: 'deal-crm-laboratoire',
        name: 'CRM Laboratoire',
        companyId: 'company-labo-ibn-rochd',
        contactId: 'contact-imane-boudiaf',
        value: 200000,
        stage: 'gagne',
        status: 'won',
        ownerId: 'owner-mt',
        source: 'instagram',
        sourceCampaignId: null,
        quoteId: 'quote-dv-2026-0041',
        createdAt: '2026-09-08',
        closedAt: '2026-09-25',
        wonAt: '2026-09-25',
    },
];

const waTiny = [
    { value: 1000, stage: 'nouveau', createdAt: '2026-09-09' },
    { value: 1000, stage: 'nouveau', createdAt: '2026-09-12' },
    { value: 1000, stage: 'qualification', createdAt: '2026-09-15' },
    { value: 2500, stage: 'qualification', createdAt: '2026-09-18' },
];
const waLost = [
    { value: 40000, createdAt: '2026-09-05', closedAt: '2026-09-16' },
    { value: 32000, createdAt: '2026-09-08', closedAt: '2026-09-19' },
    { value: 20000, createdAt: '2026-09-11', closedAt: '2026-09-22' },
    { value: 14500, createdAt: '2026-09-14', closedAt: '2026-09-27' },
];
const devisLost = [
    { value: 72000, createdAt: '2026-09-04', closedAt: '2026-09-14' },
    { value: 54000, createdAt: '2026-09-07', closedAt: '2026-09-17' },
    { value: 42000, createdAt: '2026-09-10', closedAt: '2026-09-20' },
    { value: 36000, createdAt: '2026-09-13', closedAt: '2026-09-23' },
    { value: 28000, createdAt: '2026-09-16', closedAt: '2026-09-26' },
    { value: 20000, createdAt: '2026-09-19', closedAt: '2026-09-29' },
];
const retargetLost = [
    { value: 48000, createdAt: '2026-09-06', closedAt: '2026-09-15' },
    { value: 40000, createdAt: '2026-09-12', closedAt: '2026-09-21' },
    { value: 24000, createdAt: '2026-09-17', closedAt: '2026-09-28' },
];
const oranLost = [{ value: 24000, createdAt: '2026-09-10', closedAt: '2026-09-24' }];

const organicTinyValues = [
    ...Array(11).fill(1000),
    ...Array(5).fill(2500),
    1000,
];
const organicTinyStages = [
    'nouveau', 'nouveau', 'nouveau', 'nouveau', 'nouveau', 'nouveau',
    'qualification', 'qualification', 'qualification', 'qualification',
    'proposition', 'proposition', 'proposition', 'proposition',
    'negociation', 'negociation', 'negociation',
];

function slugName(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const extraDealContacts = [];
let extraCompanyCursor = 0;

function attachGeneratedDeal(spec) {
    const company = extraCompanies[extraCompanyCursor % extraCompanies.length];
    extraCompanyCursor += 1;
    const p = person(extraDealContacts.length + 20, spec.kind);
    const contactId = `contact-${slugName(`${p.firstName} ${p.lastName}`)}-${spec.kind}`;
    const owner = ownerAt(extraDealContacts.length);
    extraDealContacts.push({
        id: contactId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        companyId: company.id,
        ownerId: owner.id,
        source: spec.source,
        sourceCampaignId: spec.sourceCampaignId,
        createdAt: spec.createdAt,
        title: 'Contact commercial',
        city: company.city,
    });
    deals.push({
        id: `deal-${spec.kind}-${String(deals.length + 1).padStart(2, '0')}`,
        name: spec.name,
        companyId: company.id,
        contactId,
        value: spec.value,
        stage: spec.stage,
        status: spec.status,
        ownerId: owner.id,
        source: spec.source,
        sourceCampaignId: spec.sourceCampaignId,
        quoteId: spec.quoteId ?? null,
        createdAt: spec.createdAt,
        closedAt: spec.closedAt ?? null,
        wonAt: null,
    });
}

waTiny.forEach((row, i) => {
    attachGeneratedDeal({
        kind: `wa-audit-${i + 1}`,
        name: `Audit express WA ${i + 1}`,
        value: row.value,
        stage: row.stage,
        status: 'open',
        source: 'whatsapp',
        sourceCampaignId: 'campaign-wa-cliniques-alger',
        createdAt: row.createdAt,
    });
});
waLost.forEach((row, i) => {
    attachGeneratedDeal({
        kind: `wa-lost-${i + 1}`,
        name: `Piste WA non retenue ${i + 1}`,
        value: row.value,
        stage: 'perdu',
        status: 'lost',
        source: 'whatsapp',
        sourceCampaignId: 'campaign-wa-cliniques-alger',
        createdAt: row.createdAt,
        closedAt: row.closedAt,
    });
});
devisLost.forEach((row, i) => {
    attachGeneratedDeal({
        kind: `site-lost-${i + 1}`,
        name: `Devis site non retenu ${i + 1}`,
        value: row.value,
        stage: 'perdu',
        status: 'lost',
        source: 'site_web',
        sourceCampaignId: 'campaign-devis-crm-sante',
        createdAt: row.createdAt,
        closedAt: row.closedAt,
    });
});
retargetLost.forEach((row, i) => {
    attachGeneratedDeal({
        kind: `ig-lost-${i + 1}`,
        name: `Retargeting non converti ${i + 1}`,
        value: row.value,
        stage: 'perdu',
        status: 'lost',
        source: 'instagram',
        sourceCampaignId: 'campaign-retargeting-devis',
        createdAt: row.createdAt,
        closedAt: row.closedAt,
    });
});
oranLost.forEach((row, i) => {
    attachGeneratedDeal({
        kind: `oran-lost-${i + 1}`,
        name: 'Piste Oran non retenue',
        value: row.value,
        stage: 'perdu',
        status: 'lost',
        source: 'autres',
        sourceCampaignId: 'campaign-prospecting-oran',
        createdAt: row.createdAt,
        closedAt: row.closedAt,
    });
});
organicTinyValues.forEach((value, i) => {
    const sources = ['recommandation', 'email', 'instagram', 'autres', 'email', 'recommandation', 'autres'];
    attachGeneratedDeal({
        kind: `organic-open-${i + 1}`,
        name: value === 2500 ? `Diagnostic cabinet ${i + 1}` : `Mini-audit ${i + 1}`,
        value,
        stage: organicTinyStages[i],
        status: 'open',
        source: sources[i % sources.length],
        sourceCampaignId: null,
        createdAt: DAYS[8 + (i % 20)],
    });
});

const dealContacts = extraDealContacts;

const SOURCE_TARGETS = {
    whatsapp: { count: 42, campaignId: 'campaign-wa-cliniques-alger', ad: true },
    site_web: { count: 28, campaignId: 'campaign-devis-crm-sante', ad: true },
    instagram_ad: { count: 12, campaignId: 'campaign-retargeting-devis', ad: true, source: 'instagram' },
    autres_ad: { count: 4, campaignId: 'campaign-prospecting-oran', ad: true, source: 'autres' },
    instagram_org: { count: 6, campaignId: null, ad: false, source: 'instagram' },
    recommandation: { count: 16, campaignId: null, ad: false },
    email: { count: 14, campaignId: null, ad: false },
    autres_org: { count: 10 - 4, campaignId: null, ad: false, source: 'autres' },
};

const reservedContactIds = new Set([
    ...namedContacts.map((c) => c.id),
    ...wonContacts.map((c) => c.id),
    ...dealContacts.map((c) => c.id),
]);

const leads = [];
const contacts = [...namedContacts, ...wonContacts, ...dealContacts];

function pushLeadFromContact(contact, extras = {}) {
    leads.push({
        id: `lead-${contact.id.replace('contact-', '')}`,
        contactId: contact.id,
        companyId: contact.companyId,
        source: contact.source,
        sourceCampaignId: contact.sourceCampaignId,
        createdAt: contact.createdAt,
        inbox: Boolean(contact.sourceCampaignId) || extras.inbox === true,
        ownerId: contact.ownerId,
        status: extras.status ?? 'qualifie',
        dealId: extras.dealId ?? null,
    });
}

namedContacts.forEach((c) => {
    const deal = deals.find((d) => d.contactId === c.id);
    pushLeadFromContact(c, { dealId: deal?.id ?? null, inbox: c.id === 'contact-amine-benali' });
});
wonContacts.forEach((c) => {
    const deal = deals.find((d) => d.contactId === c.id);
    pushLeadFromContact(c, { dealId: deal?.id ?? null, status: 'converti' });
});
dealContacts.forEach((c) => {
    const deal = deals.find((d) => d.contactId === c.id);
    pushLeadFromContact(c, {
        dealId: deal?.id ?? null,
        status: deal?.status === 'lost' ? 'perdu' : 'qualifie',
        inbox: Boolean(c.sourceCampaignId),
    });
});

const sourceCounts = {
    whatsapp: 0,
    site_web: 0,
    instagram: 0,
    recommandation: 0,
    email: 0,
    autres: 0,
};
for (const lead of leads) {
    sourceCounts[lead.source] += 1;
}

const fillerPlan = [
    { source: 'whatsapp', need: 42 - sourceCounts.whatsapp, campaignId: 'campaign-wa-cliniques-alger' },
    { source: 'site_web', need: 28 - sourceCounts.site_web, campaignId: 'campaign-devis-crm-sante' },
    { source: 'instagram', need: 18 - sourceCounts.instagram, campaignId: null, adCount: 12 - leads.filter((l) => l.source === 'instagram' && l.sourceCampaignId).length },
    { source: 'recommandation', need: 16 - sourceCounts.recommandation, campaignId: null },
    { source: 'email', need: 14 - sourceCounts.email, campaignId: null },
    { source: 'autres', need: 10 - sourceCounts.autres, campaignId: null, adCount: 4 - leads.filter((l) => l.source === 'autres' && l.sourceCampaignId).length },
];

let fillerIndex = 0;
for (const plan of fillerPlan) {
    let remainingAd = plan.adCount ?? (plan.campaignId ? plan.need : 0);
    for (let n = 0; n < plan.need; n += 1) {
        const p = person(200 + fillerIndex, plan.source);
        const company = extraCompanies[(extraCompanyCursor + fillerIndex) % extraCompanies.length];
        const owner = ownerAt(fillerIndex);
        const isAd = remainingAd > 0;
        if (isAd) {
            remainingAd -= 1;
        }
        const campaignId = isAd
            ? (plan.source === 'instagram'
                ? 'campaign-retargeting-devis'
                : plan.source === 'autres'
                    ? 'campaign-prospecting-oran'
                    : plan.campaignId)
            : null;
        const contactId = `contact-lead-${plan.source}-${fillerIndex + 1}`;
        contacts.push({
            id: contactId,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            phone: p.phone,
            companyId: company.id,
            ownerId: owner.id,
            source: plan.source,
            sourceCampaignId: campaignId,
            createdAt: DAYS[(3 + fillerIndex) % 30],
            title: 'Prospect',
            city: company.city,
        });
        leads.push({
            id: `lead-fill-${plan.source}-${fillerIndex + 1}`,
            contactId,
            companyId: company.id,
            source: plan.source,
            sourceCampaignId: campaignId,
            createdAt: DAYS[(3 + fillerIndex) % 30],
            inbox: Boolean(campaignId),
            ownerId: owner.id,
            status: 'nouveau',
            dealId: null,
        });
        fillerIndex += 1;
    }
}

const pendingQuoteValues = [
    { id: 'quote-dv-2026-0047', number: 'DV-2026-0047', value: 320000, dealId: 'deal-modernisation-crm', contactId: 'contact-amine-benali', companyId: 'company-clinique-el-djazair', ownerId: 'owner-eo', sentAt: '2026-09-08' },
    { id: 'quote-dv-2026-0051', number: 'DV-2026-0051', value: 150000, dealId: 'deal-crm-support', contactId: 'contact-lina-haddad', companyId: 'company-hopital-ibn-sina', ownerId: 'owner-rc', sentAt: '2026-09-10' },
    { id: 'quote-dv-2026-0054', number: 'DV-2026-0054', value: 120000, dealId: 'deal-digitalisation', contactId: 'contact-samir-belkacem', companyId: 'company-cabinet-dr-amrani', ownerId: 'owner-mt', sentAt: '2026-09-11' },
    { id: 'quote-dv-2026-0058', number: 'DV-2026-0058', value: 95000, dealId: 'deal-solution-commerciale', contactId: 'contact-karim-mansouri', companyId: 'company-pharmacie-centrale', ownerId: 'owner-sk', sentAt: '2026-09-12' },
];
const extraPendingValues = [80000, 75000, 70000, 65000, 55000, 45000, 40000, 35000];
const quotes = pendingQuoteValues.map((q) => ({
    ...q,
    status: 'en_attente',
    title: q.number === 'DV-2026-0047' ? 'Modernisation CRM - Clinique El Djazair' : `Devis ${q.number}`,
}));

extraPendingValues.forEach((value, i) => {
    const openOrganic = deals.filter((d) => d.status === 'open' && !d.quoteId)[i];
    const contact = contacts.find((c) => c.id === openOrganic?.contactId) ?? dealContacts[i];
    const number = `DV-2026-${String(60 + i).padStart(4, '0')}`;
    quotes.push({
        id: `quote-${number.toLowerCase()}`,
        number,
        value,
        dealId: openOrganic?.id ?? null,
        contactId: contact.id,
        companyId: contact.companyId,
        ownerId: contact.ownerId,
        sentAt: DAYS[12 + i],
        status: 'en_attente',
        title: `Devis ${number}`,
    });
    if (openOrganic) {
        openOrganic.quoteId = `quote-${number.toLowerCase()}`;
    }
});

const acceptedSpecs = [
    { dealId: 'deal-deploiement-national', value: 620000, number: 'DV-2026-0031', sentAt: '2026-09-04', acceptedAt: '2026-09-11' },
    { dealId: 'deal-plateforme-commerciale', value: 460000, number: 'DV-2026-0038', sentAt: '2026-09-09', acceptedAt: '2026-09-18' },
    { dealId: 'deal-crm-laboratoire', value: 200000, number: 'DV-2026-0041', sentAt: '2026-09-10', acceptedAt: '2026-09-25' },
];
acceptedSpecs.forEach((spec) => {
    const deal = deals.find((d) => d.id === spec.dealId);
    quotes.push({
        id: `quote-${spec.number.toLowerCase()}`,
        number: spec.number,
        value: spec.value,
        dealId: spec.dealId,
        contactId: deal.contactId,
        companyId: deal.companyId,
        ownerId: deal.ownerId,
        sentAt: spec.sentAt,
        acceptedAt: spec.acceptedAt,
        status: 'accepte',
        title: `Devis ${spec.number}`,
    });
});

const lostDeals = deals.filter((d) => d.status === 'lost');
lostDeals.slice(0, 8).forEach((deal, i) => {
    const number = `DV-2026-${String(20 + i).padStart(4, '0')}`;
    quotes.push({
        id: `quote-${number.toLowerCase()}`,
        number,
        value: Math.min(deal.value, 48000),
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
        ownerId: deal.ownerId,
        sentAt: deal.createdAt,
        refusedAt: deal.closedAt,
        status: 'refuse',
        title: `Devis ${number}`,
    });
    deal.quoteId = `quote-${number.toLowerCase()}`;
});

const leftoverQuoteCount = 42 - quotes.length;
for (let i = 0; i < leftoverQuoteCount; i += 1) {
    const contact = contacts[20 + i];
    const number = `DV-2026-${String(70 + i).padStart(4, '0')}`;
    quotes.push({
        id: `quote-${number.toLowerCase()}`,
        number,
        value: 18000 + i * 1500,
        dealId: null,
        contactId: contact.id,
        companyId: contact.companyId,
        ownerId: contact.ownerId,
        sentAt: DAYS[6 + i],
        expiredAt: DAYS[20 + (i % 8)],
        status: i < 4 ? 'expire' : 'accepte',
        title: `Devis ${number}`,
    });
}

const dailyAdPerformance = [];
for (const campaign of CAMPAIGNS) {
    const spendDays = largestRemainder(campaign.spend, dayWeights);
    const leadDays = largestRemainder(campaign.leads, dayWeights);
    const impressionDays = largestRemainder(campaign.impressions, dayWeights);
    const clickDays = largestRemainder(campaign.clicks, dayWeights);
    DAYS.forEach((date, i) => {
        dailyAdPerformance.push({
            id: `stat-${campaign.id}-${date}`,
            campaignId: campaign.id,
            date,
            spend: spendDays[i],
            leads: leadDays[i],
            impressions: impressionDays[i],
            clicks: clickDays[i],
        });
    });
}

const conversations = [
    {
        id: 'inbox-amine-benali',
        contactId: 'contact-amine-benali',
        companyId: 'company-clinique-el-djazair',
        channel: 'whatsapp',
        campaignId: 'campaign-wa-cliniques-alger',
        subject: 'Devis DV-2026-0047 - Modernisation CRM',
        lastMessageAt: '2026-09-28T10:24:00+01:00',
        unread: false,
        dealId: 'deal-modernisation-crm',
        messages: [
            { id: 'msg-am-1', at: '2026-09-03T09:12:00+01:00', from: 'contact', body: 'Bonjour, on cherche à moderniser le suivi commercial de la clinique.' },
            { id: 'msg-am-2', at: '2026-09-03T09:18:00+01:00', from: 'owner', body: 'Bonjour Amine, Elias de EvoCRM. Je vous prépare un cadrage autour de Modernisation CRM.' },
            { id: 'msg-am-3', at: '2026-09-08T16:02:00+01:00', from: 'owner', body: 'Le devis DV-2026-0047 est envoyé: 320 000 DA, en attente de votre retour.' },
            { id: 'msg-am-4', at: '2026-09-28T10:24:00+01:00', from: 'contact', body: 'On le relit avec la direction cette semaine.' },
        ],
    },
    {
        id: 'inbox-lina-haddad',
        contactId: 'contact-lina-haddad',
        companyId: 'company-hopital-ibn-sina',
        channel: 'email',
        campaignId: null,
        subject: 'CRM & Support - Hôpital Ibn Sina',
        lastMessageAt: '2026-09-27T15:40:00+01:00',
        unread: true,
        dealId: 'deal-crm-support',
        messages: [
            { id: 'msg-li-1', at: '2026-09-04T11:00:00+01:00', from: 'contact', body: 'Nadia de El Yasmin vous a recommandés pour un CRM + support.' },
            { id: 'msg-li-2', at: '2026-09-27T15:40:00+01:00', from: 'contact', body: 'Pouvez-vous confirmer le périmètre support 5 jours ?' },
        ],
    },
    {
        id: 'inbox-samir-belkacem',
        contactId: 'contact-samir-belkacem',
        companyId: 'company-cabinet-dr-amrani',
        channel: 'email',
        campaignId: null,
        subject: 'Digitalisation cabinet',
        lastMessageAt: '2026-09-26T09:05:00+01:00',
        unread: false,
        dealId: 'deal-digitalisation',
        messages: [
            { id: 'msg-sa-1', at: '2026-09-05T14:22:00+01:00', from: 'owner', body: 'Proposition Digitalisation envoyée, 280 000 DA.' },
            { id: 'msg-sa-2', at: '2026-09-26T09:05:00+01:00', from: 'contact', body: 'On valide le devis après la réunion de jeudi.' },
        ],
    },
    {
        id: 'inbox-karim-mansouri',
        contactId: 'contact-karim-mansouri',
        companyId: 'company-pharmacie-centrale',
        channel: 'instagram',
        campaignId: null,
        subject: 'Solution commerciale pharmacie',
        lastMessageAt: '2026-09-25T18:11:00+01:00',
        unread: false,
        dealId: 'deal-solution-commerciale',
        messages: [
            { id: 'msg-ka-1', at: '2026-09-06T13:40:00+01:00', from: 'contact', body: 'Vu votre page, on veut un suivi des appels officine.' },
            { id: 'msg-ka-2', at: '2026-09-25T18:11:00+01:00', from: 'owner', body: 'Négociation ouverte à 150 000 DA.' },
        ],
    },
];

const adLeadContacts = contacts.filter((c) => c.sourceCampaignId && !conversations.some((conv) => conv.contactId === c.id));
adLeadContacts.slice(0, 10).forEach((contact, i) => {
    const campaign = CAMPAIGNS.find((c) => c.id === contact.sourceCampaignId);
    conversations.push({
        id: `inbox-${contact.id}`,
        contactId: contact.id,
        companyId: contact.companyId,
        channel: campaign?.channel === 'site_web' ? 'email' : campaign?.channel ?? 'whatsapp',
        campaignId: contact.sourceCampaignId,
        subject: `Lead ${campaign?.name ?? 'Ads'}`,
        lastMessageAt: `${contact.createdAt}T11:${String(10 + i).padStart(2, '0')}:00+01:00`,
        unread: i % 3 === 0,
        dealId: deals.find((d) => d.contactId === contact.id)?.id ?? null,
        messages: [
            { id: `msg-${contact.id}-1`, at: `${contact.createdAt}T10:02:00+01:00`, from: 'contact', body: 'Je veux un devis CRM pour notre structure.' },
            { id: `msg-${contact.id}-2`, at: `${contact.createdAt}T11:${String(10 + i).padStart(2, '0')}:00+01:00`, from: 'owner', body: 'Bien reçu, on relance le cadrage.' },
        ],
    });
});

const activities = [
    { id: 'act-1', type: 'appel', title: 'Relancer Amine sur DV-2026-0047', dueAt: '2026-09-30T09:30:00+01:00', ownerId: 'owner-eo', dealId: 'deal-modernisation-crm', contactId: 'contact-amine-benali', status: 'open' },
    { id: 'act-2', type: 'reunion', title: 'Négociation CRM & Support', dueAt: '2026-09-30T14:00:00+01:00', ownerId: 'owner-rc', dealId: 'deal-crm-support', contactId: 'contact-lina-haddad', status: 'open' },
    { id: 'act-3', type: 'email', title: 'Envoyer addendum Digitalisation', dueAt: '2026-10-01T10:00:00+01:00', ownerId: 'owner-mt', dealId: 'deal-digitalisation', contactId: 'contact-samir-belkacem', status: 'open' },
    { id: 'act-4', type: 'appel', title: 'Point Pharmacie Centrale', dueAt: '2026-10-02T11:00:00+01:00', ownerId: 'owner-sk', dealId: 'deal-solution-commerciale', contactId: 'contact-karim-mansouri', status: 'open' },
    { id: 'act-5', type: 'tache', title: 'Onboarding Clinique El Yasmin', dueAt: '2026-10-03T09:00:00+01:00', ownerId: 'owner-eo', dealId: 'deal-deploiement-national', contactId: 'contact-nadia-khelifi', status: 'open' },
];

const outboundSequences = [
    {
        id: 'out-relance-devis',
        name: 'Relance devis cliniques',
        status: 'active',
        enrolledContactIds: ['contact-amine-benali', 'contact-lina-haddad', 'contact-samir-belkacem'],
        sent: 9,
        replies: 4,
    },
    {
        id: 'out-ads-followup',
        name: 'Suivi leads Ads septembre',
        status: 'active',
        enrolledContactIds: contacts.filter((c) => c.sourceCampaignId).slice(0, 12).map((c) => c.id),
        sent: 24,
        replies: 7,
    },
];

const goals = [
    { id: 'goal-ca', name: 'CA gagné septembre', metric: 'won_revenue', target: 1500000 },
    { id: 'goal-pipeline', name: 'Pipeline ouvert', metric: 'open_pipeline', target: 2500000 },
    { id: 'goal-roas', name: 'ROAS Ads', metric: 'ads_roas', target: 2 },
    { id: 'goal-quotes', name: 'Devis envoyés', metric: 'quotes_sent', target: 40 },
];

function j(value, indent = 0) {
    return JSON.stringify(value, null, 4).replace(/"([^"]+)":/g, '$1:');
}

const header = `/**
 * EvoCRM Design Lab — single source of truth for the September 2026 demo account.
 *
 * Period: 2026-09-01 → 2026-09-30, timezone Africa/Algiers, currency DA.
 * Every KPI, chart, table and object page must read this file (or selectors
 * derived from it). Aggregates are COMPUTED from the listed rows.
 *
 * ---------------------------------------------------------------------------
 * RECONCILIATION DECISIONS
 * ---------------------------------------------------------------------------
 *
 * 1. attributedRevenue
 *    Definition used here: the SUM OF DEAL VALUES for deals whose
 *    \`sourceCampaignId\` is that campaign, regardless of stage (open, won or
 *    lost). It is **created-deal value attributed to ads**, not closed-won
 *    revenue.
 *
 *    Why this definition: campaign deal counts are unique and partition the
 *    19 ad deals (9+6+3+1). Campaign attributedRevenue sums to 820 000 DA.
 *    The 3 won deals total 1 280 000 DA. Those two amounts cannot be the same
 *    population: 1 280 000 > 820 000, so the won deals cannot all sit inside
 *    the 19 ad deals if attributedRevenue is deal.value.
 *
 *    The 3 won deals are therefore organic / referral / email / Instagram
 *    organic — they have \`sourceCampaignId: null\`. Ad-attributed won count
 *    is 0. Ads "Won 3" on the funnel is the **account-level** September won
 *    count shown beside the ads funnel, not "3 of the 19 ad deals won".
 *    DATA DECISION NEEDED FROM OWNER if the funnel must mean 3/19 won from ads.
 *
 * 2. Open pipeline shape (LOCKED, not believable)
 *    Open 25 deals / 1 320 000 DA. The four named open deals already sum to
 *    1 290 000 DA, leaving 30 000 DA across 21 other open deals. Those 21 are
 *    modelled as 1 000 DA or 2 500 DA "mini-audit / diagnostic express" rows
 *    so the locked totals hold exactly.
 *    DATA DECISION NEEDED FROM OWNER — proposed corrections in the PR.
 *
 * 3. Ads leads 86 vs lead sources 128
 *    The 86 ad leads are a subset of the 128:
 *      WA Cliniques Alger (42) → source WhatsApp (42)
 *      Devis CRM Santé (28)    → source Site web (28)
 *      Retargeting Devis (12)  → 12 of 18 Instagram
 *      Prospecting Oran (4)    → 4 of 10 Autres
 *    Organic remainder (42): Instagram 6, Recommandation 16, Email 14, Autres 6.
 *
 * 4. Overall ROAS
 *    820 000 / 420 000 = 1.95238… Displayed as 2.0x by rounding to 1 decimal
 *    (\`Math.round(10 * revenue / spend) / 10\`). Campaign ROAS values 2.4 / 1.8
 *    / 1.6 / 0.8 are exact.
 *
 * 5. Conversion
 *    3 won / 17 closed = 0.17647… → 18% via \`Math.round(100 * won / closed)\`.
 */

export const DEMO_PERIOD = {
    start: '2026-09-01',
    end: '2026-09-30',
    timezone: 'Africa/Algiers',
    currency: 'DA',
    label: 'Septembre 2026',
} as const;

export const DEMO_WORKSPACE = {
    name: 'EvoCRM Santé',
    city: 'Alger',
} as const;

export const KNOWN_OBJECT_IDS = {
    companyCliniqueElDjazair: 'company-clinique-el-djazair',
    contactAmineBenali: 'contact-amine-benali',
    dealModernisationCrm: 'deal-modernisation-crm',
    quoteDv20260047: 'quote-dv-2026-0047',
    companyHopitalIbnSina: 'company-hopital-ibn-sina',
    contactLinaHaddad: 'contact-lina-haddad',
    dealCrmSupport: 'deal-crm-support',
    companyCabinetDrAmrani: 'company-cabinet-dr-amrani',
    contactSamirBelkacem: 'contact-samir-belkacem',
    dealDigitalisation: 'deal-digitalisation',
    companyPharmacieCentrale: 'company-pharmacie-centrale',
    contactKarimMansouri: 'contact-karim-mansouri',
    dealSolutionCommerciale: 'deal-solution-commerciale',
} as const;

export type DealStage =
    | 'nouveau'
    | 'qualification'
    | 'proposition'
    | 'negociation'
    | 'gagne'
    | 'perdu';

export type DealStatus = 'open' | 'won' | 'lost';

export type LeadSource =
    | 'whatsapp'
    | 'site_web'
    | 'instagram'
    | 'recommandation'
    | 'email'
    | 'autres';

export type QuoteStatus = 'en_attente' | 'accepte' | 'refuse' | 'expire';

export type Owner = {
    id: string;
    initials: string;
    name: string;
};

export type Company = {
    id: string;
    name: string;
    city: string;
    sector: string;
    domain: string;
};

export type Contact = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyId: string;
    ownerId: string;
    source: LeadSource;
    sourceCampaignId: string | null;
    createdAt: string;
    title: string;
    city: string;
};

export type Deal = {
    id: string;
    name: string;
    companyId: string;
    contactId: string;
    value: number;
    stage: DealStage;
    status: DealStatus;
    ownerId: string;
    source: LeadSource;
    sourceCampaignId: string | null;
    quoteId: string | null;
    createdAt: string;
    closedAt: string | null;
    wonAt: string | null;
};

export type Quote = {
    id: string;
    number: string;
    title: string;
    value: number;
    status: QuoteStatus;
    dealId: string | null;
    contactId: string;
    companyId: string;
    ownerId: string;
    sentAt: string;
    acceptedAt?: string;
    refusedAt?: string;
    expiredAt?: string;
};

export type Lead = {
    id: string;
    contactId: string;
    companyId: string;
    source: LeadSource;
    sourceCampaignId: string | null;
    createdAt: string;
    inbox: boolean;
    ownerId: string;
    status: 'nouveau' | 'qualifie' | 'converti' | 'perdu';
    dealId: string | null;
};

export type Campaign = {
    id: string;
    name: string;
    channel: 'whatsapp' | 'site_web' | 'instagram' | 'autres';
    spend: number;
    impressions: number;
    clicks: number;
};

export type DailyAdPerformance = {
    id: string;
    campaignId: string;
    date: string;
    spend: number;
    leads: number;
    impressions: number;
    clicks: number;
};

export type InboxMessage = {
    id: string;
    at: string;
    from: 'contact' | 'owner';
    body: string;
};

export type Conversation = {
    id: string;
    contactId: string;
    companyId: string;
    channel: string;
    campaignId: string | null;
    subject: string;
    lastMessageAt: string;
    unread: boolean;
    dealId: string | null;
    messages: InboxMessage[];
};

export type Activity = {
    id: string;
    type: 'appel' | 'reunion' | 'email' | 'tache';
    title: string;
    dueAt: string;
    ownerId: string;
    dealId: string | null;
    contactId: string;
    status: 'open' | 'done';
};

export type OutboundSequence = {
    id: string;
    name: string;
    status: 'active' | 'paused';
    enrolledContactIds: string[];
    sent: number;
    replies: number;
};

export type Goal = {
    id: string;
    name: string;
    metric: 'won_revenue' | 'open_pipeline' | 'ads_roas' | 'quotes_sent';
    target: number;
};
`;

const campaignsExport = CAMPAIGNS.map(({ leads, deals, attributedRevenue, ...rest }) => rest);

const body = `
export const owners: Owner[] = ${j(OWNERS)};

export const companies: Company[] = ${j(companies)};

export const contacts: Contact[] = ${j(contacts)};

export const campaigns: Campaign[] = ${j(campaignsExport)};

export const deals: Deal[] = ${j(deals)};

export const quotes: Quote[] = ${j(quotes)};

export const leads: Lead[] = ${j(leads)};

export const dailyAdPerformance: DailyAdPerformance[] = ${j(dailyAdPerformance)};

export const conversations: Conversation[] = ${j(conversations)};

export const activities: Activity[] = ${j(activities)};

export const outboundSequences: OutboundSequence[] = ${j(outboundSequences)};

export const goals: Goal[] = ${j(goals)};
`;

const out = header + body;
writeFileSync(join(__dir, 'evocrm-demo-data.ts'), out, 'utf8');

const sum = (arr, key) => arr.reduce((a, r) => a + r[key], 0);
const open = deals.filter((d) => d.status === 'open');
const won = deals.filter((d) => d.status === 'won');
const lost = deals.filter((d) => d.status === 'lost');
const pending = quotes.filter((q) => q.status === 'en_attente');
const adDeals = deals.filter((d) => d.sourceCampaignId);
const sourceTally = {};
for (const lead of leads) {
    sourceTally[lead.source] = (sourceTally[lead.source] ?? 0) + 1;
}

console.log({
    deals: deals.length,
    open: open.length,
    openValue: sum(open, 'value'),
    won: won.length,
    wonValue: sum(won, 'value'),
    lost: lost.length,
    closed: won.length + lost.length,
    quotes: quotes.length,
    pending: pending.length,
    pendingValue: sum(pending, 'value'),
    adDeals: adDeals.length,
    adDealValue: sum(adDeals, 'value'),
    leads: leads.length,
    adLeads: leads.filter((l) => l.sourceCampaignId).length,
    sourceTally,
    dailySpend: sum(dailyAdPerformance, 'spend'),
    dailyLeads: sum(dailyAdPerformance, 'leads'),
    dailyImpr: sum(dailyAdPerformance, 'impressions'),
    dailyClicks: sum(dailyAdPerformance, 'clicks'),
    contacts: contacts.length,
    companies: companies.length,
});
