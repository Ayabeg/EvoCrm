/**
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
 *    `sourceCampaignId` is that campaign, regardless of stage (open, won or
 *    lost). It is **created-deal value attributed to ads**, not closed-won
 *    revenue.
 *
 *    Why this definition: campaign deal counts partition the 19 ad deals.
 *    Owner-locked split is WA 9 / Devis 6 / Retarget 3 / Oran 1. Campaign
 *    attributedRevenue still sums to 820 000 DA (432 / 252 / 112 / 24).
 *    The 3 won deals total 1 280 000 DA. Those two amounts cannot be the same
 *    population: 1 280 000 > 820 000, so the won deals cannot all sit inside
 *    the 19 ad deals if attributedRevenue is deal.value.
 *
 *    The 3 won deals are therefore organic / referral / email / Instagram
 *    organic — they have `sourceCampaignId: null`. Ad-attributed won count
 *    is 0. Ads "Won 3" on the funnel is the **account-level** September won
 *    count shown beside the ads funnel, not "3 of the 19 ad deals won".
 *    DATA DECISION NEEDED FROM OWNER if the funnel must mean 3/19 won from ads.
 *
 * 2. Open pipeline — owner Option A (2026-09-29), counts restored (2026-09-29)
 *    Locked: 25 open deals / 2 550 000 DA. The four named deals stay at
 *    1 290 000 DA. The other 21 are 40 000–80 000 DA each and sum to
 *    1 260 000 DA, spread across Nouveau / Qualification / Proposition /
 *    Négociation.
 *
 *    Campaign membership stays 9 / 6 / 3 / 1. Option A leftover opens cannot
 *    sit on WA (Modernisation 320 000 + 40k+ would exceed 432 000), so the
 *    four leftover ad-sourced opens stay on Devis (3 × 60 000) and Retarget
 *    (1 × 60 000). Locked counts are kept by changing open vs lost, not by
 *    moving deals between campaigns:
 *      WA:        1 open (Modernisation 320 000) + 8 lost = 112 000 → 432 000
 *      Devis:     3 open leftovers = 180 000 + 3 lost = 72 000 → 252 000
 *      Retarget:  1 open leftover = 60 000 + 2 lost = 52 000 → 112 000
 *      Oran:      1 lost = 24 000
 *    Lost = 8+3+2+1 = 14, all ad-sourced. Won = 3 organic. Closed = 17.
 *    Open = 25: 5 ad-sourced (Modernisation + 4 leftovers) + 20 organic
 *    (Ibn Sina, Amrani, Pharmacie + 17 leftovers). Ad deals stay 19 / 820 000.
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
 *    (`Math.round(10 * revenue / spend) / 10`). Campaign ROAS values 2.4 / 1.8
 *    / 1.6 / 0.8 are exact.
 *
 * 5. Conversion
 *    3 won / 17 closed = 0.17647… → 18% via `Math.round(100 * won / closed)`.
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

export const owners: Owner[] = [
    {
        id: "owner-eo",
        initials: "EO",
        name: "Elias Ouadah"
    },
    {
        id: "owner-rc",
        initials: "RC",
        name: "Rania Cherif"
    },
    {
        id: "owner-mt",
        initials: "MT",
        name: "Mehdi Taleb"
    },
    {
        id: "owner-sk",
        initials: "SK",
        name: "Sofia Kaci"
    }
];

export const companies: Company[] = [
    {
        id: "company-clinique-el-djazair",
        name: "Clinique El Djazair",
        city: "Alger",
        sector: "Clinique",
        domain: "clinique-djazair.dz"
    },
    {
        id: "company-hopital-ibn-sina",
        name: "Hôpital Ibn Sina",
        city: "Alger",
        sector: "Hôpital",
        domain: "ibn-sina.dz"
    },
    {
        id: "company-cabinet-dr-amrani",
        name: "Cabinet Dr. Amrani",
        city: "Blida",
        sector: "Cabinet",
        domain: "cabinet-amrani.dz"
    },
    {
        id: "company-pharmacie-centrale",
        name: "Pharmacie Centrale",
        city: "Alger",
        sector: "Pharmacie",
        domain: "pharmacie-centrale.dz"
    },
    {
        id: "company-clinique-el-yasmin",
        name: "Clinique El Yasmin",
        city: "Alger",
        sector: "Clinique",
        domain: "clinique-yasmin.dz"
    },
    {
        id: "company-groupe-sante-atlas",
        name: "Groupe Santé Atlas",
        city: "Oran",
        sector: "Groupe hospitalier",
        domain: "sante-atlas.dz"
    },
    {
        id: "company-labo-ibn-rochd",
        name: "Laboratoire Ibn Rochd",
        city: "Constantine",
        sector: "Laboratoire",
        domain: "ibn-rochd-lab.dz"
    },
    {
        id: "company-clinique-el-wafa",
        name: "Clinique El Wafa",
        city: "Oran",
        sector: "Clinique",
        domain: "clinique-el-wafa.dz"
    },
    {
        id: "company-cabinet-dr-boudiaf",
        name: "Cabinet Dr. Boudiaf",
        city: "Sétif",
        sector: "Cabinet",
        domain: "cabinet-dr-boudiaf.dz"
    },
    {
        id: "company-pharmacie-el-amel",
        name: "Pharmacie El Amel",
        city: "Tizi Ouzou",
        sector: "Pharmacie",
        domain: "pharmacie-el-amel.dz"
    },
    {
        id: "company-polyclinique-el-hidhab",
        name: "Polyclinique El Hidhab",
        city: "Alger",
        sector: "Clinique",
        domain: "polyclinique-el-hidhab.dz"
    },
    {
        id: "company-centre-dentaire-lumiere",
        name: "Centre Dentaire Lumière",
        city: "Oran",
        sector: "Cabinet",
        domain: "centre-dentaire-lumiere.dz"
    },
    {
        id: "company-clinique-el-amel",
        name: "Clinique El Amel",
        city: "Annaba",
        sector: "Clinique",
        domain: "clinique-el-amel.dz"
    },
    {
        id: "company-laboratoire-el-hikma",
        name: "Laboratoire El Hikma",
        city: "Blida",
        sector: "Laboratoire",
        domain: "laboratoire-el-hikma.dz"
    },
    {
        id: "company-cabinet-dr-ziani",
        name: "Cabinet Dr. Ziani",
        city: "Béjaïa",
        sector: "Cabinet",
        domain: "cabinet-dr-ziani.dz"
    },
    {
        id: "company-pharmacie-ibn-khaldoun",
        name: "Pharmacie Ibn Khaldoun",
        city: "Constantine",
        sector: "Pharmacie",
        domain: "pharmacie-ibn-khaldoun.dz"
    },
    {
        id: "company-clinique-el-nour",
        name: "Clinique El Nour",
        city: "Alger",
        sector: "Clinique",
        domain: "clinique-el-nour.dz"
    },
    {
        id: "company-hopital-el-massira",
        name: "Hôpital El Massira",
        city: "Oran",
        sector: "Hôpital",
        domain: "hopital-el-massira.dz"
    },
    {
        id: "company-cabinet-dr-hamdi",
        name: "Cabinet Dr. Hamdi",
        city: "Tlemcen",
        sector: "Cabinet",
        domain: "cabinet-dr-hamdi.dz"
    },
    {
        id: "company-clinique-el-qods",
        name: "Clinique El Qods",
        city: "Alger",
        sector: "Clinique",
        domain: "clinique-el-qods.dz"
    },
    {
        id: "company-centre-medical-atlas",
        name: "Centre Médical Atlas",
        city: "Sétif",
        sector: "Clinique",
        domain: "centre-medical-atlas.dz"
    },
    {
        id: "company-pharmacie-el-feth",
        name: "Pharmacie El Feth",
        city: "Alger",
        sector: "Pharmacie",
        domain: "pharmacie-el-feth.dz"
    },
    {
        id: "company-cabinet-dr-saadi",
        name: "Cabinet Dr. Saadi",
        city: "Oran",
        sector: "Cabinet",
        domain: "cabinet-dr-saadi.dz"
    },
    {
        id: "company-clinique-el-rahma",
        name: "Clinique El Rahma",
        city: "Constantine",
        sector: "Clinique",
        domain: "clinique-el-rahma.dz"
    },
    {
        id: "company-polyclinique-el-bassatine",
        name: "Polyclinique El Bassatine",
        city: "Blida",
        sector: "Clinique",
        domain: "polyclinique-el-bassatine.dz"
    },
    {
        id: "company-laboratoire-el-chifa",
        name: "Laboratoire El Chifa",
        city: "Alger",
        sector: "Laboratoire",
        domain: "laboratoire-el-chifa.dz"
    },
    {
        id: "company-cabinet-dr-touati",
        name: "Cabinet Dr. Touati",
        city: "Annaba",
        sector: "Cabinet",
        domain: "cabinet-dr-touati.dz"
    },
    {
        id: "company-clinique-el-hayat",
        name: "Clinique El Hayat",
        city: "Oran",
        sector: "Clinique",
        domain: "clinique-el-hayat.dz"
    },
    {
        id: "company-pharmacie-el-hikmat",
        name: "Pharmacie El Hikmat",
        city: "Sétif",
        sector: "Pharmacie",
        domain: "pharmacie-el-hikmat.dz"
    },
    {
        id: "company-centre-ophtalmo-el-nour",
        name: "Centre Ophtalmo El Nour",
        city: "Alger",
        sector: "Cabinet",
        domain: "centre-ophtalmo-el-nour.dz"
    },
    {
        id: "company-clinique-el-baraka",
        name: "Clinique El Baraka",
        city: "Tizi Ouzou",
        sector: "Clinique",
        domain: "clinique-el-baraka.dz"
    },
    {
        id: "company-hopital-el-farabi",
        name: "Hôpital El Farabi",
        city: "Constantine",
        sector: "Hôpital",
        domain: "hopital-el-farabi.dz"
    },
    {
        id: "company-cabinet-dr-gherbi",
        name: "Cabinet Dr. Gherbi",
        city: "Oran",
        sector: "Cabinet",
        domain: "cabinet-dr-gherbi.dz"
    },
    {
        id: "company-clinique-el-ikhlas",
        name: "Clinique El Ikhlas",
        city: "Alger",
        sector: "Clinique",
        domain: "clinique-el-ikhlas.dz"
    },
    {
        id: "company-pharmacie-el-quds",
        name: "Pharmacie El Quds",
        city: "Blida",
        sector: "Pharmacie",
        domain: "pharmacie-el-quds.dz"
    },
    {
        id: "company-laboratoire-el-amal",
        name: "Laboratoire El Amal",
        city: "Oran",
        sector: "Laboratoire",
        domain: "laboratoire-el-amal.dz"
    },
    {
        id: "company-cabinet-dr-lounis",
        name: "Cabinet Dr. Lounis",
        city: "Alger",
        sector: "Cabinet",
        domain: "cabinet-dr-lounis.dz"
    },
    {
        id: "company-clinique-el-massara",
        name: "Clinique El Massara",
        city: "Annaba",
        sector: "Clinique",
        domain: "clinique-el-massara.dz"
    },
    {
        id: "company-polyclinique-el-andalous",
        name: "Polyclinique El Andalous",
        city: "Oran",
        sector: "Clinique",
        domain: "polyclinique-el-andalous.dz"
    },
    {
        id: "company-centre-cardio-el-djazair",
        name: "Centre Cardio El Djazair",
        city: "Alger",
        sector: "Clinique",
        domain: "centre-cardio-el-djazair.dz"
    },
    {
        id: "company-cabinet-dr-mokrani",
        name: "Cabinet Dr. Mokrani",
        city: "Constantine",
        sector: "Cabinet",
        domain: "cabinet-dr-mokrani.dz"
    },
    {
        id: "company-clinique-el-houda",
        name: "Clinique El Houda",
        city: "Sétif",
        sector: "Clinique",
        domain: "clinique-el-houda.dz"
    }
];

export const contacts: Contact[] = [
    {
        id: "contact-amine-benali",
        firstName: "Amine",
        lastName: "Benali",
        email: "amine.benali@clinique-djazair.dz",
        phone: "+213 555 120 447",
        companyId: "company-clinique-el-djazair",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-03",
        title: "Directeur administratif",
        city: "Alger"
    },
    {
        id: "contact-lina-haddad",
        firstName: "Lina",
        lastName: "Haddad",
        email: "lina.haddad@ibn-sina.dz",
        phone: "+213 555 221 810",
        companyId: "company-hopital-ibn-sina",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-04",
        title: "Responsable SI",
        city: "Alger"
    },
    {
        id: "contact-samir-belkacem",
        firstName: "Samir",
        lastName: "Belkacem",
        email: "samir.belkacem@cabinet-amrani.dz",
        phone: "+213 555 334 092",
        companyId: "company-cabinet-dr-amrani",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-05",
        title: "Gérant",
        city: "Blida"
    },
    {
        id: "contact-karim-mansouri",
        firstName: "Karim",
        lastName: "Mansouri",
        email: "karim.mansouri@pharmacie-centrale.dz",
        phone: "+213 555 448 671",
        companyId: "company-pharmacie-centrale",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-06",
        title: "Pharmacien titulaire",
        city: "Alger"
    },
    {
        id: "contact-nadia-khelifi",
        firstName: "Nadia",
        lastName: "Khelifi",
        email: "nadia.khelifi@clinique-yasmin.dz",
        phone: "+213 555 501 220",
        companyId: "company-clinique-el-yasmin",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-02",
        title: "Directrice générale",
        city: "Alger"
    },
    {
        id: "contact-youcef-rahali",
        firstName: "Youcef",
        lastName: "Rahali",
        email: "youcef.rahali@sante-atlas.dz",
        phone: "+213 555 612 903",
        companyId: "company-groupe-sante-atlas",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-07",
        title: "Directeur commercial",
        city: "Oran"
    },
    {
        id: "contact-imane-boudiaf",
        firstName: "Imane",
        lastName: "Boudiaf",
        email: "imane.boudiaf@ibn-rochd-lab.dz",
        phone: "+213 555 773 441",
        companyId: "company-labo-ibn-rochd",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        title: "Responsable qualité",
        city: "Constantine"
    },
    {
        id: "contact-anis-messaoudi-wa-lost-1",
        firstName: "Anis",
        lastName: "Messaoudi",
        email: "anis.messaoudi.wa-lost-1@mail.dz",
        phone: "+213 570 120 30",
        companyId: "company-clinique-el-wafa",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-kahina-hamdi-wa-lost-2",
        firstName: "Kahina",
        lastName: "Hamdi",
        email: "kahina.hamdi.wa-lost-2@mail.dz",
        phone: "+213 571 121 31",
        companyId: "company-cabinet-dr-boudiaf",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        title: "Contact commercial",
        city: "Sétif"
    },
    {
        id: "contact-reda-belaid-wa-lost-3",
        firstName: "Reda",
        lastName: "Belaid",
        email: "reda.belaid.wa-lost-3@mail.dz",
        phone: "+213 572 122 32",
        companyId: "company-pharmacie-el-amel",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-08",
        title: "Contact commercial",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-imane-benkhaled-wa-lost-4",
        firstName: "Imane",
        lastName: "Benkhaled",
        email: "imane.benkhaled.wa-lost-4@mail.dz",
        phone: "+213 573 123 33",
        companyId: "company-polyclinique-el-hidhab",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-09",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-hakim-lounis-wa-lost-5",
        firstName: "Hakim",
        lastName: "Lounis",
        email: "hakim.lounis.wa-lost-5@mail.dz",
        phone: "+213 574 124 34",
        companyId: "company-centre-dentaire-lumiere",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-11",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-nadia-kaci-wa-lost-6",
        firstName: "Nadia",
        lastName: "Kaci",
        email: "nadia.kaci.wa-lost-6@mail.dz",
        phone: "+213 575 125 35",
        companyId: "company-clinique-el-amel",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-13",
        title: "Contact commercial",
        city: "Annaba"
    },
    {
        id: "contact-lotfi-mansouri-wa-lost-7",
        firstName: "Lotfi",
        lastName: "Mansouri",
        email: "lotfi.mansouri.wa-lost-7@mail.dz",
        phone: "+213 576 126 36",
        companyId: "company-laboratoire-el-hikma",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-14",
        title: "Contact commercial",
        city: "Blida"
    },
    {
        id: "contact-salima-benali-wa-lost-8",
        firstName: "Salima",
        lastName: "Benali",
        email: "salima.benali.wa-lost-8@mail.dz",
        phone: "+213 577 127 37",
        companyId: "company-cabinet-dr-ziani",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-21",
        title: "Contact commercial",
        city: "Béjaïa"
    },
    {
        id: "contact-youcef-boudiaf-site-lost-1",
        firstName: "Youcef",
        lastName: "Boudiaf",
        email: "youcef.boudiaf.site-lost-1@mail.dz",
        phone: "+213 578 128 38",
        companyId: "company-pharmacie-ibn-khaldoun",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-04",
        title: "Contact commercial",
        city: "Constantine"
    },
    {
        id: "contact-fella-ziani-site-lost-2",
        firstName: "Fella",
        lastName: "Ziani",
        email: "fella.ziani.site-lost-2@mail.dz",
        phone: "+213 579 129 39",
        companyId: "company-clinique-el-nour",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-07",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-karim-cherif-site-lost-3",
        firstName: "Karim",
        lastName: "Cherif",
        email: "karim.cherif.site-lost-3@mail.dz",
        phone: "+213 580 130 40",
        companyId: "company-hopital-el-massira",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-10",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-rania-touati-ig-lost-1",
        firstName: "Rania",
        lastName: "Touati",
        email: "rania.touati.ig-lost-1@mail.dz",
        phone: "+213 581 131 41",
        companyId: "company-cabinet-dr-hamdi",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        title: "Contact commercial",
        city: "Tlemcen"
    },
    {
        id: "contact-omar-ait-ali-ig-lost-2",
        firstName: "Omar",
        lastName: "Ait Ali",
        email: "omar.aitali.ig-lost-2@mail.dz",
        phone: "+213 582 132 42",
        companyId: "company-clinique-el-qods",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-12",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-celine-oussedik-oran-lost-1",
        firstName: "Celine",
        lastName: "Oussedik",
        email: "celine.oussedik.oran-lost-1@mail.dz",
        phone: "+213 583 133 43",
        companyId: "company-centre-medical-atlas",
        ownerId: "owner-rc",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-10",
        title: "Contact commercial",
        city: "Sétif"
    },
    {
        id: "contact-mounir-benyahia-open-1",
        firstName: "Mounir",
        lastName: "Benyahia",
        email: "mounir.benyahia.open-1@mail.dz",
        phone: "+213 584 134 44",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-mt",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-09",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-wafa-ouadah-open-2",
        firstName: "Wafa",
        lastName: "Ouadah",
        email: "wafa.ouadah.open-2@mail.dz",
        phone: "+213 585 135 45",
        companyId: "company-cabinet-dr-saadi",
        ownerId: "owner-sk",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-10",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-samy-haddad-open-3",
        firstName: "Samy",
        lastName: "Haddad",
        email: "samy.haddad.open-3@mail.dz",
        phone: "+213 586 136 46",
        companyId: "company-clinique-el-rahma",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-11",
        title: "Contact commercial",
        city: "Constantine"
    },
    {
        id: "contact-leila-ibrahim-open-4",
        firstName: "Leila",
        lastName: "Ibrahim",
        email: "leila.ibrahim.open-4@mail.dz",
        phone: "+213 587 137 47",
        companyId: "company-polyclinique-el-bassatine",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-12",
        title: "Contact commercial",
        city: "Blida"
    },
    {
        id: "contact-bilel-rahal-open-5",
        firstName: "Bilel",
        lastName: "Rahal",
        email: "bilel.rahal.open-5@mail.dz",
        phone: "+213 588 138 48",
        companyId: "company-laboratoire-el-chifa",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-13",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-asma-bouaziz-open-6",
        firstName: "Asma",
        lastName: "Bouaziz",
        email: "asma.bouaziz.open-6@mail.dz",
        phone: "+213 589 139 49",
        companyId: "company-cabinet-dr-touati",
        ownerId: "owner-sk",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-14",
        title: "Contact commercial",
        city: "Annaba"
    },
    {
        id: "contact-nassim-saadi-open-7",
        firstName: "Nassim",
        lastName: "Saadi",
        email: "nassim.saadi.open-7@mail.dz",
        phone: "+213 550 140 50",
        companyId: "company-clinique-el-hayat",
        ownerId: "owner-eo",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-15",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-hayat-gherbi-open-8",
        firstName: "Hayat",
        lastName: "Gherbi",
        email: "hayat.gherbi.open-8@mail.dz",
        phone: "+213 551 141 51",
        companyId: "company-pharmacie-el-hikmat",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        title: "Contact commercial",
        city: "Sétif"
    },
    {
        id: "contact-zakaria-djebbar-open-9",
        firstName: "Zakaria",
        lastName: "Djebbar",
        email: "zakaria.djebbar.open-9@mail.dz",
        phone: "+213 552 142 52",
        companyId: "company-centre-ophtalmo-el-nour",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-16",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-sihem-mokrani-open-10",
        firstName: "Sihem",
        lastName: "Mokrani",
        email: "sihem.mokrani.open-10@mail.dz",
        phone: "+213 553 143 53",
        companyId: "company-clinique-el-baraka",
        ownerId: "owner-sk",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-17",
        title: "Contact commercial",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-amine-taleb-open-11",
        firstName: "Amine",
        lastName: "Taleb",
        email: "amine.taleb.open-11@mail.dz",
        phone: "+213 554 144 54",
        companyId: "company-hopital-el-farabi",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-18",
        title: "Contact commercial",
        city: "Constantine"
    },
    {
        id: "contact-lina-belkacem-open-12",
        firstName: "Lina",
        lastName: "Belkacem",
        email: "lina.belkacem.open-12@mail.dz",
        phone: "+213 555 145 55",
        companyId: "company-cabinet-dr-gherbi",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-19",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-samir-amrani-open-13",
        firstName: "Samir",
        lastName: "Amrani",
        email: "samir.amrani.open-13@mail.dz",
        phone: "+213 556 146 56",
        companyId: "company-clinique-el-ikhlas",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-07",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-karim-khelifi-open-14",
        firstName: "Karim",
        lastName: "Khelifi",
        email: "karim.khelifi.open-14@mail.dz",
        phone: "+213 557 147 57",
        companyId: "company-pharmacie-el-quds",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-20",
        title: "Contact commercial",
        city: "Blida"
    },
    {
        id: "contact-yanis-messaoudi-open-15",
        firstName: "Yanis",
        lastName: "Messaoudi",
        email: "yanis.messaoudi.open-15@mail.dz",
        phone: "+213 558 148 58",
        companyId: "company-laboratoire-el-amal",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-21",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-nour-hamdi-open-16",
        firstName: "Nour",
        lastName: "Hamdi",
        email: "nour.hamdi.open-16@mail.dz",
        phone: "+213 559 149 59",
        companyId: "company-cabinet-dr-lounis",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-22",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-bilal-belaid-open-17",
        firstName: "Bilal",
        lastName: "Belaid",
        email: "bilal.belaid.open-17@mail.dz",
        phone: "+213 560 150 60",
        companyId: "company-clinique-el-massara",
        ownerId: "owner-mt",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-23",
        title: "Contact commercial",
        city: "Annaba"
    },
    {
        id: "contact-ines-benkhaled-open-18",
        firstName: "Ines",
        lastName: "Benkhaled",
        email: "ines.benkhaled.open-18@mail.dz",
        phone: "+213 561 151 61",
        companyId: "company-polyclinique-el-andalous",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        title: "Contact commercial",
        city: "Oran"
    },
    {
        id: "contact-sofiane-lounis-open-19",
        firstName: "Sofiane",
        lastName: "Lounis",
        email: "sofiane.lounis.open-19@mail.dz",
        phone: "+213 562 152 62",
        companyId: "company-centre-cardio-el-djazair",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-24",
        title: "Contact commercial",
        city: "Alger"
    },
    {
        id: "contact-yasmine-kaci-open-20",
        firstName: "Yasmine",
        lastName: "Kaci",
        email: "yasmine.kaci.open-20@mail.dz",
        phone: "+213 563 153 63",
        companyId: "company-cabinet-dr-mokrani",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-25",
        title: "Contact commercial",
        city: "Constantine"
    },
    {
        id: "contact-riad-mansouri-open-21",
        firstName: "Riad",
        lastName: "Mansouri",
        email: "riad.mansouri.open-21@mail.dz",
        phone: "+213 564 154 64",
        companyId: "company-clinique-el-houda",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-26",
        title: "Contact commercial",
        city: "Sétif"
    },
    {
        id: "contact-lead-whatsapp-1",
        firstName: "Walid",
        lastName: "Ait Ali",
        email: "walid.aitali.whatsapp@mail.dz",
        phone: "+213 550 300 30",
        companyId: "company-clinique-el-wafa",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-04",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-2",
        firstName: "Soraya",
        lastName: "Oussedik",
        email: "soraya.oussedik.whatsapp@mail.dz",
        phone: "+213 551 301 31",
        companyId: "company-cabinet-dr-boudiaf",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-whatsapp-3",
        firstName: "Mehdi",
        lastName: "Benyahia",
        email: "mehdi.benyahia.whatsapp@mail.dz",
        phone: "+213 552 302 32",
        companyId: "company-pharmacie-el-amel",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        title: "Prospect",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-lead-whatsapp-4",
        firstName: "Lila",
        lastName: "Ouadah",
        email: "lila.ouadah.whatsapp@mail.dz",
        phone: "+213 553 303 33",
        companyId: "company-polyclinique-el-hidhab",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-07",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-5",
        firstName: "Adel",
        lastName: "Haddad",
        email: "adel.haddad.whatsapp@mail.dz",
        phone: "+213 554 304 34",
        companyId: "company-centre-dentaire-lumiere",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-08",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-6",
        firstName: "Hana",
        lastName: "Ibrahim",
        email: "hana.ibrahim.whatsapp@mail.dz",
        phone: "+213 555 305 35",
        companyId: "company-clinique-el-amel",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-09",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-whatsapp-7",
        firstName: "Nabil",
        lastName: "Rahal",
        email: "nabil.rahal.whatsapp@mail.dz",
        phone: "+213 556 306 36",
        companyId: "company-laboratoire-el-hikma",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-10",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-whatsapp-8",
        firstName: "Sara",
        lastName: "Bouaziz",
        email: "sara.bouaziz.whatsapp@mail.dz",
        phone: "+213 557 307 37",
        companyId: "company-cabinet-dr-ziani",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-11",
        title: "Prospect",
        city: "Béjaïa"
    },
    {
        id: "contact-lead-whatsapp-9",
        firstName: "Farid",
        lastName: "Saadi",
        email: "farid.saadi.whatsapp@mail.dz",
        phone: "+213 558 308 38",
        companyId: "company-pharmacie-ibn-khaldoun",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-12",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-whatsapp-10",
        firstName: "Meriem",
        lastName: "Gherbi",
        email: "meriem.gherbi.whatsapp@mail.dz",
        phone: "+213 559 309 39",
        companyId: "company-clinique-el-nour",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-13",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-11",
        firstName: "Tarek",
        lastName: "Djebbar",
        email: "tarek.djebbar.whatsapp@mail.dz",
        phone: "+213 560 310 40",
        companyId: "company-hopital-el-massira",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-14",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-12",
        firstName: "Dounia",
        lastName: "Mokrani",
        email: "dounia.mokrani.whatsapp@mail.dz",
        phone: "+213 561 311 41",
        companyId: "company-cabinet-dr-hamdi",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-15",
        title: "Prospect",
        city: "Tlemcen"
    },
    {
        id: "contact-lead-whatsapp-13",
        firstName: "Anis",
        lastName: "Taleb",
        email: "anis.taleb.whatsapp@mail.dz",
        phone: "+213 562 312 42",
        companyId: "company-clinique-el-qods",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-16",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-14",
        firstName: "Kahina",
        lastName: "Belkacem",
        email: "kahina.belkacem.whatsapp@mail.dz",
        phone: "+213 563 313 43",
        companyId: "company-centre-medical-atlas",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-17",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-whatsapp-15",
        firstName: "Reda",
        lastName: "Amrani",
        email: "reda.amrani.whatsapp@mail.dz",
        phone: "+213 564 314 44",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-18",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-16",
        firstName: "Imane",
        lastName: "Khelifi",
        email: "imane.khelifi.whatsapp@mail.dz",
        phone: "+213 565 315 45",
        companyId: "company-cabinet-dr-saadi",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-19",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-17",
        firstName: "Hakim",
        lastName: "Messaoudi",
        email: "hakim.messaoudi.whatsapp@mail.dz",
        phone: "+213 566 316 46",
        companyId: "company-clinique-el-rahma",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-20",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-whatsapp-18",
        firstName: "Nadia",
        lastName: "Hamdi",
        email: "nadia.hamdi.whatsapp@mail.dz",
        phone: "+213 567 317 47",
        companyId: "company-polyclinique-el-bassatine",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-21",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-whatsapp-19",
        firstName: "Lotfi",
        lastName: "Belaid",
        email: "lotfi.belaid.whatsapp@mail.dz",
        phone: "+213 568 318 48",
        companyId: "company-laboratoire-el-chifa",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-22",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-20",
        firstName: "Salima",
        lastName: "Benkhaled",
        email: "salima.benkhaled.whatsapp@mail.dz",
        phone: "+213 569 319 49",
        companyId: "company-cabinet-dr-touati",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-23",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-whatsapp-21",
        firstName: "Youcef",
        lastName: "Lounis",
        email: "youcef.lounis.whatsapp@mail.dz",
        phone: "+213 570 320 50",
        companyId: "company-clinique-el-hayat",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-24",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-22",
        firstName: "Fella",
        lastName: "Kaci",
        email: "fella.kaci.whatsapp@mail.dz",
        phone: "+213 571 321 51",
        companyId: "company-pharmacie-el-hikmat",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-25",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-whatsapp-23",
        firstName: "Karim",
        lastName: "Mansouri",
        email: "karim.mansouri.whatsapp@mail.dz",
        phone: "+213 572 322 52",
        companyId: "company-centre-ophtalmo-el-nour",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-26",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-24",
        firstName: "Rania",
        lastName: "Benali",
        email: "rania.benali.whatsapp@mail.dz",
        phone: "+213 573 323 53",
        companyId: "company-clinique-el-baraka",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-27",
        title: "Prospect",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-lead-whatsapp-25",
        firstName: "Omar",
        lastName: "Boudiaf",
        email: "omar.boudiaf.whatsapp@mail.dz",
        phone: "+213 574 324 54",
        companyId: "company-hopital-el-farabi",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-28",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-whatsapp-26",
        firstName: "Celine",
        lastName: "Ziani",
        email: "celine.ziani.whatsapp@mail.dz",
        phone: "+213 575 325 55",
        companyId: "company-cabinet-dr-gherbi",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-29",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-27",
        firstName: "Mounir",
        lastName: "Cherif",
        email: "mounir.cherif.whatsapp@mail.dz",
        phone: "+213 576 326 56",
        companyId: "company-clinique-el-ikhlas",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-30",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-28",
        firstName: "Wafa",
        lastName: "Touati",
        email: "wafa.touati.whatsapp@mail.dz",
        phone: "+213 577 327 57",
        companyId: "company-pharmacie-el-quds",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-01",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-whatsapp-29",
        firstName: "Samy",
        lastName: "Ait Ali",
        email: "samy.aitali.whatsapp@mail.dz",
        phone: "+213 578 328 58",
        companyId: "company-laboratoire-el-amal",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-02",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-30",
        firstName: "Leila",
        lastName: "Oussedik",
        email: "leila.oussedik.whatsapp@mail.dz",
        phone: "+213 579 329 59",
        companyId: "company-cabinet-dr-lounis",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-03",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-whatsapp-31",
        firstName: "Bilel",
        lastName: "Benyahia",
        email: "bilel.benyahia.whatsapp@mail.dz",
        phone: "+213 580 330 60",
        companyId: "company-clinique-el-massara",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-04",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-whatsapp-32",
        firstName: "Asma",
        lastName: "Ouadah",
        email: "asma.ouadah.whatsapp@mail.dz",
        phone: "+213 581 331 61",
        companyId: "company-polyclinique-el-andalous",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-whatsapp-33",
        firstName: "Nassim",
        lastName: "Haddad",
        email: "nassim.haddad.whatsapp@mail.dz",
        phone: "+213 582 332 62",
        companyId: "company-centre-cardio-el-djazair",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-34",
        firstName: "Hayat",
        lastName: "Ibrahim",
        email: "hayat.ibrahim.site_web@mail.dz",
        phone: "+213 583 333 63",
        companyId: "company-cabinet-dr-mokrani",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-07",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-site_web-35",
        firstName: "Zakaria",
        lastName: "Rahal",
        email: "zakaria.rahal.site_web@mail.dz",
        phone: "+213 584 334 64",
        companyId: "company-clinique-el-houda",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-08",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-site_web-36",
        firstName: "Sihem",
        lastName: "Bouaziz",
        email: "sihem.bouaziz.site_web@mail.dz",
        phone: "+213 585 335 65",
        companyId: "company-clinique-el-wafa",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-09",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-site_web-37",
        firstName: "Amine",
        lastName: "Saadi",
        email: "amine.saadi.site_web@mail.dz",
        phone: "+213 586 336 66",
        companyId: "company-cabinet-dr-boudiaf",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-10",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-site_web-38",
        firstName: "Lina",
        lastName: "Gherbi",
        email: "lina.gherbi.site_web@mail.dz",
        phone: "+213 587 337 67",
        companyId: "company-pharmacie-el-amel",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-11",
        title: "Prospect",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-lead-site_web-39",
        firstName: "Samir",
        lastName: "Djebbar",
        email: "samir.djebbar.site_web@mail.dz",
        phone: "+213 588 338 68",
        companyId: "company-polyclinique-el-hidhab",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-12",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-40",
        firstName: "Karim",
        lastName: "Mokrani",
        email: "karim.mokrani.site_web@mail.dz",
        phone: "+213 589 339 69",
        companyId: "company-centre-dentaire-lumiere",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-13",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-site_web-41",
        firstName: "Yanis",
        lastName: "Taleb",
        email: "yanis.taleb.site_web@mail.dz",
        phone: "+213 550 340 70",
        companyId: "company-clinique-el-amel",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-14",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-site_web-42",
        firstName: "Nour",
        lastName: "Belkacem",
        email: "nour.belkacem.site_web@mail.dz",
        phone: "+213 551 341 71",
        companyId: "company-laboratoire-el-hikma",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-15",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-site_web-43",
        firstName: "Bilal",
        lastName: "Amrani",
        email: "bilal.amrani.site_web@mail.dz",
        phone: "+213 552 342 72",
        companyId: "company-cabinet-dr-ziani",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-16",
        title: "Prospect",
        city: "Béjaïa"
    },
    {
        id: "contact-lead-site_web-44",
        firstName: "Ines",
        lastName: "Khelifi",
        email: "ines.khelifi.site_web@mail.dz",
        phone: "+213 553 343 73",
        companyId: "company-pharmacie-ibn-khaldoun",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-17",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-site_web-45",
        firstName: "Sofiane",
        lastName: "Messaoudi",
        email: "sofiane.messaoudi.site_web@mail.dz",
        phone: "+213 554 344 74",
        companyId: "company-clinique-el-nour",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-18",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-46",
        firstName: "Yasmine",
        lastName: "Hamdi",
        email: "yasmine.hamdi.site_web@mail.dz",
        phone: "+213 555 345 75",
        companyId: "company-hopital-el-massira",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-19",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-site_web-47",
        firstName: "Riad",
        lastName: "Belaid",
        email: "riad.belaid.site_web@mail.dz",
        phone: "+213 556 346 76",
        companyId: "company-cabinet-dr-hamdi",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-20",
        title: "Prospect",
        city: "Tlemcen"
    },
    {
        id: "contact-lead-site_web-48",
        firstName: "Amina",
        lastName: "Benkhaled",
        email: "amina.benkhaled.site_web@mail.dz",
        phone: "+213 557 347 77",
        companyId: "company-clinique-el-qods",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-21",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-49",
        firstName: "Walid",
        lastName: "Lounis",
        email: "walid.lounis.site_web@mail.dz",
        phone: "+213 558 348 78",
        companyId: "company-centre-medical-atlas",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-22",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-site_web-50",
        firstName: "Soraya",
        lastName: "Kaci",
        email: "soraya.kaci.site_web@mail.dz",
        phone: "+213 559 349 79",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-23",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-51",
        firstName: "Mehdi",
        lastName: "Mansouri",
        email: "mehdi.mansouri.site_web@mail.dz",
        phone: "+213 560 350 80",
        companyId: "company-cabinet-dr-saadi",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-24",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-site_web-52",
        firstName: "Lila",
        lastName: "Benali",
        email: "lila.benali.site_web@mail.dz",
        phone: "+213 561 351 81",
        companyId: "company-clinique-el-rahma",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-25",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-site_web-53",
        firstName: "Adel",
        lastName: "Boudiaf",
        email: "adel.boudiaf.site_web@mail.dz",
        phone: "+213 562 352 82",
        companyId: "company-polyclinique-el-bassatine",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-26",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-site_web-54",
        firstName: "Hana",
        lastName: "Ziani",
        email: "hana.ziani.site_web@mail.dz",
        phone: "+213 563 353 83",
        companyId: "company-laboratoire-el-chifa",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-27",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-site_web-55",
        firstName: "Nabil",
        lastName: "Cherif",
        email: "nabil.cherif.site_web@mail.dz",
        phone: "+213 564 354 84",
        companyId: "company-cabinet-dr-touati",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-28",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-instagram-56",
        firstName: "Sara",
        lastName: "Touati",
        email: "sara.touati.instagram@mail.dz",
        phone: "+213 565 355 85",
        companyId: "company-clinique-el-hayat",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-29",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-instagram-57",
        firstName: "Farid",
        lastName: "Ait Ali",
        email: "farid.aitali.instagram@mail.dz",
        phone: "+213 566 356 86",
        companyId: "company-pharmacie-el-hikmat",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-30",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-instagram-58",
        firstName: "Meriem",
        lastName: "Oussedik",
        email: "meriem.oussedik.instagram@mail.dz",
        phone: "+213 567 357 87",
        companyId: "company-centre-ophtalmo-el-nour",
        ownerId: "owner-rc",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-01",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-instagram-59",
        firstName: "Tarek",
        lastName: "Benyahia",
        email: "tarek.benyahia.instagram@mail.dz",
        phone: "+213 568 358 88",
        companyId: "company-clinique-el-baraka",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-02",
        title: "Prospect",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-lead-instagram-60",
        firstName: "Dounia",
        lastName: "Ouadah",
        email: "dounia.ouadah.instagram@mail.dz",
        phone: "+213 569 359 89",
        companyId: "company-hopital-el-farabi",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-03",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-instagram-61",
        firstName: "Anis",
        lastName: "Haddad",
        email: "anis.haddad.instagram@mail.dz",
        phone: "+213 570 360 90",
        companyId: "company-cabinet-dr-gherbi",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-04",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-instagram-62",
        firstName: "Kahina",
        lastName: "Ibrahim",
        email: "kahina.ibrahim.instagram@mail.dz",
        phone: "+213 571 361 91",
        companyId: "company-clinique-el-ikhlas",
        ownerId: "owner-rc",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-05",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-instagram-63",
        firstName: "Reda",
        lastName: "Rahal",
        email: "reda.rahal.instagram@mail.dz",
        phone: "+213 572 362 92",
        companyId: "company-pharmacie-el-quds",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-instagram-64",
        firstName: "Imane",
        lastName: "Bouaziz",
        email: "imane.bouaziz.instagram@mail.dz",
        phone: "+213 573 363 93",
        companyId: "company-laboratoire-el-amal",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-07",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-instagram-65",
        firstName: "Hakim",
        lastName: "Saadi",
        email: "hakim.saadi.instagram@mail.dz",
        phone: "+213 574 364 94",
        companyId: "company-cabinet-dr-lounis",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-recommandation-66",
        firstName: "Nadia",
        lastName: "Gherbi",
        email: "nadia.gherbi.recommandation@mail.dz",
        phone: "+213 575 365 95",
        companyId: "company-clinique-el-massara",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-09",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-recommandation-67",
        firstName: "Lotfi",
        lastName: "Djebbar",
        email: "lotfi.djebbar.recommandation@mail.dz",
        phone: "+213 576 366 96",
        companyId: "company-polyclinique-el-andalous",
        ownerId: "owner-mt",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-10",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-recommandation-68",
        firstName: "Salima",
        lastName: "Mokrani",
        email: "salima.mokrani.recommandation@mail.dz",
        phone: "+213 577 367 97",
        companyId: "company-centre-cardio-el-djazair",
        ownerId: "owner-sk",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-11",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-recommandation-69",
        firstName: "Youcef",
        lastName: "Taleb",
        email: "youcef.taleb.recommandation@mail.dz",
        phone: "+213 578 368 98",
        companyId: "company-cabinet-dr-mokrani",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-12",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-recommandation-70",
        firstName: "Fella",
        lastName: "Belkacem",
        email: "fella.belkacem.recommandation@mail.dz",
        phone: "+213 579 369 99",
        companyId: "company-clinique-el-houda",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-13",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-recommandation-71",
        firstName: "Karim",
        lastName: "Amrani",
        email: "karim.amrani.recommandation@mail.dz",
        phone: "+213 580 370 10",
        companyId: "company-clinique-el-wafa",
        ownerId: "owner-mt",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-14",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-recommandation-72",
        firstName: "Rania",
        lastName: "Khelifi",
        email: "rania.khelifi.recommandation@mail.dz",
        phone: "+213 581 371 11",
        companyId: "company-cabinet-dr-boudiaf",
        ownerId: "owner-sk",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-15",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-recommandation-73",
        firstName: "Omar",
        lastName: "Messaoudi",
        email: "omar.messaoudi.recommandation@mail.dz",
        phone: "+213 582 372 12",
        companyId: "company-pharmacie-el-amel",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-16",
        title: "Prospect",
        city: "Tizi Ouzou"
    },
    {
        id: "contact-lead-email-74",
        firstName: "Celine",
        lastName: "Hamdi",
        email: "celine.hamdi.email@mail.dz",
        phone: "+213 583 373 13",
        companyId: "company-polyclinique-el-hidhab",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-17",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-email-75",
        firstName: "Mounir",
        lastName: "Belaid",
        email: "mounir.belaid.email@mail.dz",
        phone: "+213 584 374 14",
        companyId: "company-centre-dentaire-lumiere",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-18",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-email-76",
        firstName: "Wafa",
        lastName: "Benkhaled",
        email: "wafa.benkhaled.email@mail.dz",
        phone: "+213 585 375 15",
        companyId: "company-clinique-el-amel",
        ownerId: "owner-sk",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-19",
        title: "Prospect",
        city: "Annaba"
    },
    {
        id: "contact-lead-email-77",
        firstName: "Samy",
        lastName: "Lounis",
        email: "samy.lounis.email@mail.dz",
        phone: "+213 586 376 16",
        companyId: "company-laboratoire-el-hikma",
        ownerId: "owner-eo",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-20",
        title: "Prospect",
        city: "Blida"
    },
    {
        id: "contact-lead-email-78",
        firstName: "Leila",
        lastName: "Kaci",
        email: "leila.kaci.email@mail.dz",
        phone: "+213 587 377 17",
        companyId: "company-cabinet-dr-ziani",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-21",
        title: "Prospect",
        city: "Béjaïa"
    },
    {
        id: "contact-lead-email-79",
        firstName: "Bilel",
        lastName: "Mansouri",
        email: "bilel.mansouri.email@mail.dz",
        phone: "+213 588 378 18",
        companyId: "company-pharmacie-ibn-khaldoun",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-22",
        title: "Prospect",
        city: "Constantine"
    },
    {
        id: "contact-lead-autres-80",
        firstName: "Asma",
        lastName: "Benali",
        email: "asma.benali.autres@mail.dz",
        phone: "+213 589 379 19",
        companyId: "company-clinique-el-nour",
        ownerId: "owner-sk",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-23",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-autres-81",
        firstName: "Nassim",
        lastName: "Boudiaf",
        email: "nassim.boudiaf.autres@mail.dz",
        phone: "+213 550 380 20",
        companyId: "company-hopital-el-massira",
        ownerId: "owner-eo",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-24",
        title: "Prospect",
        city: "Oran"
    },
    {
        id: "contact-lead-autres-82",
        firstName: "Hayat",
        lastName: "Ziani",
        email: "hayat.ziani.autres@mail.dz",
        phone: "+213 551 381 21",
        companyId: "company-cabinet-dr-hamdi",
        ownerId: "owner-rc",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-25",
        title: "Prospect",
        city: "Tlemcen"
    },
    {
        id: "contact-lead-autres-83",
        firstName: "Zakaria",
        lastName: "Cherif",
        email: "zakaria.cherif.autres@mail.dz",
        phone: "+213 552 382 22",
        companyId: "company-clinique-el-qods",
        ownerId: "owner-mt",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-26",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-autres-84",
        firstName: "Sihem",
        lastName: "Touati",
        email: "sihem.touati.autres@mail.dz",
        phone: "+213 553 383 23",
        companyId: "company-centre-medical-atlas",
        ownerId: "owner-sk",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-27",
        title: "Prospect",
        city: "Sétif"
    },
    {
        id: "contact-lead-autres-85",
        firstName: "Amine",
        lastName: "Ait Ali",
        email: "amine.aitali.autres@mail.dz",
        phone: "+213 554 384 24",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-eo",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-28",
        title: "Prospect",
        city: "Alger"
    },
    {
        id: "contact-lead-autres-86",
        firstName: "Lina",
        lastName: "Oussedik",
        email: "lina.oussedik.autres@mail.dz",
        phone: "+213 555 385 25",
        companyId: "company-cabinet-dr-saadi",
        ownerId: "owner-rc",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-29",
        title: "Prospect",
        city: "Oran"
    }
];

export const campaigns: Campaign[] = [
    {
        id: "campaign-wa-cliniques-alger",
        name: "WA Cliniques Alger",
        channel: "whatsapp",
        spend: 180000,
        impressions: 78000,
        clicks: 1766
    },
    {
        id: "campaign-devis-crm-sante",
        name: "Devis CRM Santé",
        channel: "site_web",
        spend: 140000,
        impressions: 60667,
        clicks: 1373
    },
    {
        id: "campaign-retargeting-devis",
        name: "Retargeting Devis",
        channel: "instagram",
        spend: 70000,
        impressions: 30333,
        clicks: 687
    },
    {
        id: "campaign-prospecting-oran",
        name: "Prospecting Oran",
        channel: "autres",
        spend: 30000,
        impressions: 13000,
        clicks: 294
    }
];

export const deals: Deal[] = [
    {
        id: "deal-modernisation-crm",
        name: "Modernisation CRM",
        companyId: "company-clinique-el-djazair",
        contactId: "contact-amine-benali",
        value: 320000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0047",
        createdAt: "2026-09-03",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-crm-support",
        name: "CRM & Support",
        companyId: "company-hopital-ibn-sina",
        contactId: "contact-lina-haddad",
        value: 540000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0051",
        createdAt: "2026-09-04",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-digitalisation",
        name: "Digitalisation",
        companyId: "company-cabinet-dr-amrani",
        contactId: "contact-samir-belkacem",
        value: 280000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0054",
        createdAt: "2026-09-05",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-solution-commerciale",
        name: "Solution commerciale",
        companyId: "company-pharmacie-centrale",
        contactId: "contact-karim-mansouri",
        value: 150000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0058",
        createdAt: "2026-09-06",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-deploiement-national",
        name: "Déploiement CRM national",
        companyId: "company-clinique-el-yasmin",
        contactId: "contact-nadia-khelifi",
        value: 620000,
        stage: "gagne",
        status: "won",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0031",
        createdAt: "2026-09-02",
        closedAt: "2026-09-11",
        wonAt: "2026-09-11"
    },
    {
        id: "deal-plateforme-commerciale",
        name: "Plateforme commerciale",
        companyId: "company-groupe-sante-atlas",
        contactId: "contact-youcef-rahali",
        value: 460000,
        stage: "gagne",
        status: "won",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0038",
        createdAt: "2026-09-07",
        closedAt: "2026-09-18",
        wonAt: "2026-09-18"
    },
    {
        id: "deal-crm-laboratoire",
        name: "CRM Laboratoire",
        companyId: "company-labo-ibn-rochd",
        contactId: "contact-imane-boudiaf",
        value: 200000,
        stage: "gagne",
        status: "won",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0041",
        createdAt: "2026-09-08",
        closedAt: "2026-09-25",
        wonAt: "2026-09-25"
    },
    {
        id: "deal-wa-lost-1-08",
        name: "Piste WA non retenue 1",
        companyId: "company-clinique-el-wafa",
        contactId: "contact-anis-messaoudi-wa-lost-1",
        value: 20000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0020",
        createdAt: "2026-09-05",
        closedAt: "2026-09-16",
        wonAt: null
    },
    {
        id: "deal-wa-lost-2-09",
        name: "Piste WA non retenue 2",
        companyId: "company-cabinet-dr-boudiaf",
        contactId: "contact-kahina-hamdi-wa-lost-2",
        value: 18000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0021",
        createdAt: "2026-09-06",
        closedAt: "2026-09-17",
        wonAt: null
    },
    {
        id: "deal-wa-lost-3-10",
        name: "Piste WA non retenue 3",
        companyId: "company-pharmacie-el-amel",
        contactId: "contact-reda-belaid-wa-lost-3",
        value: 16000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0022",
        createdAt: "2026-09-08",
        closedAt: "2026-09-19",
        wonAt: null
    },
    {
        id: "deal-wa-lost-4-11",
        name: "Piste WA non retenue 4",
        companyId: "company-polyclinique-el-hidhab",
        contactId: "contact-imane-benkhaled-wa-lost-4",
        value: 15000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0023",
        createdAt: "2026-09-09",
        closedAt: "2026-09-20",
        wonAt: null
    },
    {
        id: "deal-wa-lost-5-12",
        name: "Piste WA non retenue 5",
        companyId: "company-centre-dentaire-lumiere",
        contactId: "contact-hakim-lounis-wa-lost-5",
        value: 14000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-eo",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0024",
        createdAt: "2026-09-11",
        closedAt: "2026-09-22",
        wonAt: null
    },
    {
        id: "deal-wa-lost-6-13",
        name: "Piste WA non retenue 6",
        companyId: "company-clinique-el-amel",
        contactId: "contact-nadia-kaci-wa-lost-6",
        value: 12000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-rc",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0025",
        createdAt: "2026-09-13",
        closedAt: "2026-09-24",
        wonAt: null
    },
    {
        id: "deal-wa-lost-7-14",
        name: "Piste WA non retenue 7",
        companyId: "company-laboratoire-el-hikma",
        contactId: "contact-lotfi-mansouri-wa-lost-7",
        value: 10000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-mt",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0026",
        createdAt: "2026-09-14",
        closedAt: "2026-09-27",
        wonAt: null
    },
    {
        id: "deal-wa-lost-8-15",
        name: "Piste WA non retenue 8",
        companyId: "company-cabinet-dr-ziani",
        contactId: "contact-salima-benali-wa-lost-8",
        value: 7000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-sk",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        quoteId: "quote-dv-2026-0027",
        createdAt: "2026-09-21",
        closedAt: "2026-09-29",
        wonAt: null
    },
    {
        id: "deal-site-lost-1-16",
        name: "Devis site non retenu 1",
        companyId: "company-pharmacie-ibn-khaldoun",
        contactId: "contact-youcef-boudiaf-site-lost-1",
        value: 32000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-eo",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: null,
        createdAt: "2026-09-04",
        closedAt: "2026-09-14",
        wonAt: null
    },
    {
        id: "deal-site-lost-2-17",
        name: "Devis site non retenu 2",
        companyId: "company-clinique-el-nour",
        contactId: "contact-fella-ziani-site-lost-2",
        value: 24000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-rc",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: null,
        createdAt: "2026-09-07",
        closedAt: "2026-09-17",
        wonAt: null
    },
    {
        id: "deal-site-lost-3-18",
        name: "Devis site non retenu 3",
        companyId: "company-hopital-el-massira",
        contactId: "contact-karim-cherif-site-lost-3",
        value: 16000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: null,
        createdAt: "2026-09-10",
        closedAt: "2026-09-20",
        wonAt: null
    },
    {
        id: "deal-ig-lost-1-19",
        name: "Retargeting non converti 1",
        companyId: "company-cabinet-dr-hamdi",
        contactId: "contact-rania-touati-ig-lost-1",
        value: 30000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        quoteId: null,
        createdAt: "2026-09-06",
        closedAt: "2026-09-15",
        wonAt: null
    },
    {
        id: "deal-ig-lost-2-20",
        name: "Retargeting non converti 2",
        companyId: "company-clinique-el-qods",
        contactId: "contact-omar-ait-ali-ig-lost-2",
        value: 22000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        quoteId: null,
        createdAt: "2026-09-12",
        closedAt: "2026-09-21",
        wonAt: null
    },
    {
        id: "deal-oran-lost-1-21",
        name: "Piste Oran non retenue",
        companyId: "company-centre-medical-atlas",
        contactId: "contact-celine-oussedik-oran-lost-1",
        value: 24000,
        stage: "perdu",
        status: "lost",
        ownerId: "owner-rc",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        quoteId: null,
        createdAt: "2026-09-10",
        closedAt: "2026-09-24",
        wonAt: null
    },
    {
        id: "deal-open-1-22",
        name: "Cadrage clinique neuve",
        companyId: "company-pharmacie-el-feth",
        contactId: "contact-mounir-benyahia-open-1",
        value: 80000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-mt",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0060",
        createdAt: "2026-09-09",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-2-23",
        name: "Premier échange polyclinique",
        companyId: "company-cabinet-dr-saadi",
        contactId: "contact-wafa-ouadah-open-2",
        value: 75000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-sk",
        source: "email",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-10",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-3-24",
        name: "Piste cabinet de groupe",
        companyId: "company-clinique-el-rahma",
        contactId: "contact-samy-haddad-open-3",
        value: 70000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0061",
        createdAt: "2026-09-11",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-4-25",
        name: "Prise de contact laboratoire",
        companyId: "company-polyclinique-el-bassatine",
        contactId: "contact-leila-ibrahim-open-4",
        value: 65000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-12",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-5-26",
        name: "Lead site — clinique de ville",
        companyId: "company-laboratoire-el-chifa",
        contactId: "contact-bilel-rahal-open-5",
        value: 60000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: "quote-dv-2026-0062",
        createdAt: "2026-09-13",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-6-27",
        name: "Signalement pharmacie de quartier",
        companyId: "company-cabinet-dr-touati",
        contactId: "contact-asma-bouaziz-open-6",
        value: 55000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-sk",
        source: "autres",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-14",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-7-28",
        name: "Inbound email — cabinet dentaire",
        companyId: "company-clinique-el-hayat",
        contactId: "contact-nassim-saadi-open-7",
        value: 50000,
        stage: "nouveau",
        status: "open",
        ownerId: "owner-eo",
        source: "email",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0063",
        createdAt: "2026-09-15",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-8-29",
        name: "Audit commercial clinique",
        companyId: "company-pharmacie-el-hikmat",
        contactId: "contact-hayat-gherbi-open-8",
        value: 70000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-08",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-9-30",
        name: "Qualification devis site",
        companyId: "company-centre-ophtalmo-el-nour",
        contactId: "contact-zakaria-djebbar-open-9",
        value: 60000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-mt",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: "quote-dv-2026-0064",
        createdAt: "2026-09-16",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-10-31",
        name: "Diagnostic CRM cabinet",
        companyId: "company-clinique-el-baraka",
        contactId: "contact-sihem-mokrani-open-10",
        value: 60000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-sk",
        source: "email",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-17",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-11-32",
        name: "Qualification Instagram organique",
        companyId: "company-hopital-el-farabi",
        contactId: "contact-amine-taleb-open-11",
        value: 55000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-eo",
        source: "instagram",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0065",
        createdAt: "2026-09-18",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-12-33",
        name: "Cadrage laboratoire régional",
        companyId: "company-cabinet-dr-gherbi",
        contactId: "contact-lina-belkacem-open-12",
        value: 50000,
        stage: "qualification",
        status: "open",
        ownerId: "owner-rc",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-19",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-13-34",
        name: "Proposition CRM clinique",
        companyId: "company-clinique-el-ikhlas",
        contactId: "contact-samir-amrani-open-13",
        value: 65000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-mt",
        source: "email",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0066",
        createdAt: "2026-09-07",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-14-35",
        name: "Offre digitalisation — site",
        companyId: "company-pharmacie-el-quds",
        contactId: "contact-karim-khelifi-open-14",
        value: 60000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-sk",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        quoteId: null,
        createdAt: "2026-09-20",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-15-36",
        name: "Proposition cabinet spécialisé",
        companyId: "company-laboratoire-el-amal",
        contactId: "contact-yanis-messaoudi-open-15",
        value: 55000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: "quote-dv-2026-0067",
        createdAt: "2026-09-21",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-16-37",
        name: "Offre support laboratoire",
        companyId: "company-cabinet-dr-lounis",
        contactId: "contact-nour-hamdi-open-16",
        value: 50000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-22",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-17-38",
        name: "Proposition pharmacie réseau",
        companyId: "company-clinique-el-massara",
        contactId: "contact-bilal-belaid-open-17",
        value: 50000,
        stage: "proposition",
        status: "open",
        ownerId: "owner-mt",
        source: "autres",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-23",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-18-39",
        name: "Négociation retargeting devis",
        companyId: "company-polyclinique-el-andalous",
        contactId: "contact-ines-benkhaled-open-18",
        value: 60000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-sk",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        quoteId: null,
        createdAt: "2026-09-06",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-19-40",
        name: "Négociation licence clinique",
        companyId: "company-centre-cardio-el-djazair",
        contactId: "contact-sofiane-lounis-open-19",
        value: 55000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-eo",
        source: "recommandation",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-24",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-20-41",
        name: "Avenant support cabinet",
        companyId: "company-cabinet-dr-mokrani",
        contactId: "contact-yasmine-kaci-open-20",
        value: 55000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-rc",
        source: "email",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-25",
        closedAt: null,
        wonAt: null
    },
    {
        id: "deal-open-21-42",
        name: "Négociation déploiement régional",
        companyId: "company-clinique-el-houda",
        contactId: "contact-riad-mansouri-open-21",
        value: 60000,
        stage: "negociation",
        status: "open",
        ownerId: "owner-mt",
        source: "instagram",
        sourceCampaignId: null,
        quoteId: null,
        createdAt: "2026-09-26",
        closedAt: null,
        wonAt: null
    }
];

export const quotes: Quote[] = [
    {
        id: "quote-dv-2026-0047",
        number: "DV-2026-0047",
        value: 320000,
        dealId: "deal-modernisation-crm",
        contactId: "contact-amine-benali",
        companyId: "company-clinique-el-djazair",
        ownerId: "owner-eo",
        sentAt: "2026-09-08",
        status: "en_attente",
        title: "Modernisation CRM - Clinique El Djazair"
    },
    {
        id: "quote-dv-2026-0051",
        number: "DV-2026-0051",
        value: 150000,
        dealId: "deal-crm-support",
        contactId: "contact-lina-haddad",
        companyId: "company-hopital-ibn-sina",
        ownerId: "owner-rc",
        sentAt: "2026-09-10",
        status: "en_attente",
        title: "Devis DV-2026-0051"
    },
    {
        id: "quote-dv-2026-0054",
        number: "DV-2026-0054",
        value: 120000,
        dealId: "deal-digitalisation",
        contactId: "contact-samir-belkacem",
        companyId: "company-cabinet-dr-amrani",
        ownerId: "owner-mt",
        sentAt: "2026-09-11",
        status: "en_attente",
        title: "Devis DV-2026-0054"
    },
    {
        id: "quote-dv-2026-0058",
        number: "DV-2026-0058",
        value: 95000,
        dealId: "deal-solution-commerciale",
        contactId: "contact-karim-mansouri",
        companyId: "company-pharmacie-centrale",
        ownerId: "owner-sk",
        sentAt: "2026-09-12",
        status: "en_attente",
        title: "Devis DV-2026-0058"
    },
    {
        id: "quote-dv-2026-0060",
        number: "DV-2026-0060",
        value: 80000,
        dealId: "deal-open-1-22",
        contactId: "contact-mounir-benyahia-open-1",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-mt",
        sentAt: "2026-09-13",
        status: "en_attente",
        title: "Devis DV-2026-0060"
    },
    {
        id: "quote-dv-2026-0061",
        number: "DV-2026-0061",
        value: 75000,
        dealId: "deal-open-3-24",
        contactId: "contact-samy-haddad-open-3",
        companyId: "company-clinique-el-rahma",
        ownerId: "owner-eo",
        sentAt: "2026-09-14",
        status: "en_attente",
        title: "Devis DV-2026-0061"
    },
    {
        id: "quote-dv-2026-0062",
        number: "DV-2026-0062",
        value: 70000,
        dealId: "deal-open-5-26",
        contactId: "contact-bilel-rahal-open-5",
        companyId: "company-laboratoire-el-chifa",
        ownerId: "owner-mt",
        sentAt: "2026-09-15",
        status: "en_attente",
        title: "Devis DV-2026-0062"
    },
    {
        id: "quote-dv-2026-0063",
        number: "DV-2026-0063",
        value: 65000,
        dealId: "deal-open-7-28",
        contactId: "contact-nassim-saadi-open-7",
        companyId: "company-clinique-el-hayat",
        ownerId: "owner-eo",
        sentAt: "2026-09-16",
        status: "en_attente",
        title: "Devis DV-2026-0063"
    },
    {
        id: "quote-dv-2026-0064",
        number: "DV-2026-0064",
        value: 55000,
        dealId: "deal-open-9-30",
        contactId: "contact-zakaria-djebbar-open-9",
        companyId: "company-centre-ophtalmo-el-nour",
        ownerId: "owner-mt",
        sentAt: "2026-09-17",
        status: "en_attente",
        title: "Devis DV-2026-0064"
    },
    {
        id: "quote-dv-2026-0065",
        number: "DV-2026-0065",
        value: 45000,
        dealId: "deal-open-11-32",
        contactId: "contact-amine-taleb-open-11",
        companyId: "company-hopital-el-farabi",
        ownerId: "owner-eo",
        sentAt: "2026-09-18",
        status: "en_attente",
        title: "Devis DV-2026-0065"
    },
    {
        id: "quote-dv-2026-0066",
        number: "DV-2026-0066",
        value: 40000,
        dealId: "deal-open-13-34",
        contactId: "contact-samir-amrani-open-13",
        companyId: "company-clinique-el-ikhlas",
        ownerId: "owner-mt",
        sentAt: "2026-09-19",
        status: "en_attente",
        title: "Devis DV-2026-0066"
    },
    {
        id: "quote-dv-2026-0067",
        number: "DV-2026-0067",
        value: 35000,
        dealId: "deal-open-15-36",
        contactId: "contact-yanis-messaoudi-open-15",
        companyId: "company-laboratoire-el-amal",
        ownerId: "owner-eo",
        sentAt: "2026-09-20",
        status: "en_attente",
        title: "Devis DV-2026-0067"
    },
    {
        id: "quote-dv-2026-0031",
        number: "DV-2026-0031",
        value: 620000,
        dealId: "deal-deploiement-national",
        contactId: "contact-nadia-khelifi",
        companyId: "company-clinique-el-yasmin",
        ownerId: "owner-eo",
        sentAt: "2026-09-04",
        acceptedAt: "2026-09-11",
        status: "accepte",
        title: "Devis DV-2026-0031"
    },
    {
        id: "quote-dv-2026-0038",
        number: "DV-2026-0038",
        value: 460000,
        dealId: "deal-plateforme-commerciale",
        contactId: "contact-youcef-rahali",
        companyId: "company-groupe-sante-atlas",
        ownerId: "owner-rc",
        sentAt: "2026-09-09",
        acceptedAt: "2026-09-18",
        status: "accepte",
        title: "Devis DV-2026-0038"
    },
    {
        id: "quote-dv-2026-0041",
        number: "DV-2026-0041",
        value: 200000,
        dealId: "deal-crm-laboratoire",
        contactId: "contact-imane-boudiaf",
        companyId: "company-labo-ibn-rochd",
        ownerId: "owner-mt",
        sentAt: "2026-09-10",
        acceptedAt: "2026-09-25",
        status: "accepte",
        title: "Devis DV-2026-0041"
    },
    {
        id: "quote-dv-2026-0020",
        number: "DV-2026-0020",
        value: 20000,
        dealId: "deal-wa-lost-1-08",
        contactId: "contact-anis-messaoudi-wa-lost-1",
        companyId: "company-clinique-el-wafa",
        ownerId: "owner-eo",
        sentAt: "2026-09-05",
        refusedAt: "2026-09-16",
        status: "refuse",
        title: "Devis DV-2026-0020"
    },
    {
        id: "quote-dv-2026-0021",
        number: "DV-2026-0021",
        value: 18000,
        dealId: "deal-wa-lost-2-09",
        contactId: "contact-kahina-hamdi-wa-lost-2",
        companyId: "company-cabinet-dr-boudiaf",
        ownerId: "owner-rc",
        sentAt: "2026-09-06",
        refusedAt: "2026-09-17",
        status: "refuse",
        title: "Devis DV-2026-0021"
    },
    {
        id: "quote-dv-2026-0022",
        number: "DV-2026-0022",
        value: 16000,
        dealId: "deal-wa-lost-3-10",
        contactId: "contact-reda-belaid-wa-lost-3",
        companyId: "company-pharmacie-el-amel",
        ownerId: "owner-mt",
        sentAt: "2026-09-08",
        refusedAt: "2026-09-19",
        status: "refuse",
        title: "Devis DV-2026-0022"
    },
    {
        id: "quote-dv-2026-0023",
        number: "DV-2026-0023",
        value: 15000,
        dealId: "deal-wa-lost-4-11",
        contactId: "contact-imane-benkhaled-wa-lost-4",
        companyId: "company-polyclinique-el-hidhab",
        ownerId: "owner-sk",
        sentAt: "2026-09-09",
        refusedAt: "2026-09-20",
        status: "refuse",
        title: "Devis DV-2026-0023"
    },
    {
        id: "quote-dv-2026-0024",
        number: "DV-2026-0024",
        value: 14000,
        dealId: "deal-wa-lost-5-12",
        contactId: "contact-hakim-lounis-wa-lost-5",
        companyId: "company-centre-dentaire-lumiere",
        ownerId: "owner-eo",
        sentAt: "2026-09-11",
        refusedAt: "2026-09-22",
        status: "refuse",
        title: "Devis DV-2026-0024"
    },
    {
        id: "quote-dv-2026-0025",
        number: "DV-2026-0025",
        value: 12000,
        dealId: "deal-wa-lost-6-13",
        contactId: "contact-nadia-kaci-wa-lost-6",
        companyId: "company-clinique-el-amel",
        ownerId: "owner-rc",
        sentAt: "2026-09-13",
        refusedAt: "2026-09-24",
        status: "refuse",
        title: "Devis DV-2026-0025"
    },
    {
        id: "quote-dv-2026-0026",
        number: "DV-2026-0026",
        value: 10000,
        dealId: "deal-wa-lost-7-14",
        contactId: "contact-lotfi-mansouri-wa-lost-7",
        companyId: "company-laboratoire-el-hikma",
        ownerId: "owner-mt",
        sentAt: "2026-09-14",
        refusedAt: "2026-09-27",
        status: "refuse",
        title: "Devis DV-2026-0026"
    },
    {
        id: "quote-dv-2026-0027",
        number: "DV-2026-0027",
        value: 7000,
        dealId: "deal-wa-lost-8-15",
        contactId: "contact-salima-benali-wa-lost-8",
        companyId: "company-cabinet-dr-ziani",
        ownerId: "owner-sk",
        sentAt: "2026-09-21",
        refusedAt: "2026-09-29",
        status: "refuse",
        title: "Devis DV-2026-0027"
    },
    {
        id: "quote-dv-2026-0070",
        number: "DV-2026-0070",
        value: 18000,
        dealId: null,
        contactId: "contact-celine-oussedik-oran-lost-1",
        companyId: "company-centre-medical-atlas",
        ownerId: "owner-rc",
        sentAt: "2026-09-07",
        expiredAt: "2026-09-21",
        status: "expire",
        title: "Devis DV-2026-0070"
    },
    {
        id: "quote-dv-2026-0071",
        number: "DV-2026-0071",
        value: 19500,
        dealId: null,
        contactId: "contact-mounir-benyahia-open-1",
        companyId: "company-pharmacie-el-feth",
        ownerId: "owner-mt",
        sentAt: "2026-09-08",
        expiredAt: "2026-09-22",
        status: "expire",
        title: "Devis DV-2026-0071"
    },
    {
        id: "quote-dv-2026-0072",
        number: "DV-2026-0072",
        value: 21000,
        dealId: null,
        contactId: "contact-wafa-ouadah-open-2",
        companyId: "company-cabinet-dr-saadi",
        ownerId: "owner-sk",
        sentAt: "2026-09-09",
        expiredAt: "2026-09-23",
        status: "expire",
        title: "Devis DV-2026-0072"
    },
    {
        id: "quote-dv-2026-0073",
        number: "DV-2026-0073",
        value: 22500,
        dealId: null,
        contactId: "contact-samy-haddad-open-3",
        companyId: "company-clinique-el-rahma",
        ownerId: "owner-eo",
        sentAt: "2026-09-10",
        expiredAt: "2026-09-24",
        status: "expire",
        title: "Devis DV-2026-0073"
    },
    {
        id: "quote-dv-2026-0074",
        number: "DV-2026-0074",
        value: 24000,
        dealId: null,
        contactId: "contact-leila-ibrahim-open-4",
        companyId: "company-polyclinique-el-bassatine",
        ownerId: "owner-rc",
        sentAt: "2026-09-11",
        expiredAt: "2026-09-25",
        status: "accepte",
        title: "Devis DV-2026-0074"
    },
    {
        id: "quote-dv-2026-0075",
        number: "DV-2026-0075",
        value: 25500,
        dealId: null,
        contactId: "contact-bilel-rahal-open-5",
        companyId: "company-laboratoire-el-chifa",
        ownerId: "owner-mt",
        sentAt: "2026-09-12",
        expiredAt: "2026-09-26",
        status: "accepte",
        title: "Devis DV-2026-0075"
    },
    {
        id: "quote-dv-2026-0076",
        number: "DV-2026-0076",
        value: 27000,
        dealId: null,
        contactId: "contact-asma-bouaziz-open-6",
        companyId: "company-cabinet-dr-touati",
        ownerId: "owner-sk",
        sentAt: "2026-09-13",
        expiredAt: "2026-09-27",
        status: "accepte",
        title: "Devis DV-2026-0076"
    },
    {
        id: "quote-dv-2026-0077",
        number: "DV-2026-0077",
        value: 28500,
        dealId: null,
        contactId: "contact-nassim-saadi-open-7",
        companyId: "company-clinique-el-hayat",
        ownerId: "owner-eo",
        sentAt: "2026-09-14",
        expiredAt: "2026-09-28",
        status: "accepte",
        title: "Devis DV-2026-0077"
    },
    {
        id: "quote-dv-2026-0078",
        number: "DV-2026-0078",
        value: 30000,
        dealId: null,
        contactId: "contact-hayat-gherbi-open-8",
        companyId: "company-pharmacie-el-hikmat",
        ownerId: "owner-rc",
        sentAt: "2026-09-15",
        expiredAt: "2026-09-21",
        status: "accepte",
        title: "Devis DV-2026-0078"
    },
    {
        id: "quote-dv-2026-0079",
        number: "DV-2026-0079",
        value: 31500,
        dealId: null,
        contactId: "contact-zakaria-djebbar-open-9",
        companyId: "company-centre-ophtalmo-el-nour",
        ownerId: "owner-mt",
        sentAt: "2026-09-16",
        expiredAt: "2026-09-22",
        status: "accepte",
        title: "Devis DV-2026-0079"
    },
    {
        id: "quote-dv-2026-0080",
        number: "DV-2026-0080",
        value: 33000,
        dealId: null,
        contactId: "contact-sihem-mokrani-open-10",
        companyId: "company-clinique-el-baraka",
        ownerId: "owner-sk",
        sentAt: "2026-09-17",
        expiredAt: "2026-09-23",
        status: "accepte",
        title: "Devis DV-2026-0080"
    },
    {
        id: "quote-dv-2026-0081",
        number: "DV-2026-0081",
        value: 34500,
        dealId: null,
        contactId: "contact-amine-taleb-open-11",
        companyId: "company-hopital-el-farabi",
        ownerId: "owner-eo",
        sentAt: "2026-09-18",
        expiredAt: "2026-09-24",
        status: "accepte",
        title: "Devis DV-2026-0081"
    },
    {
        id: "quote-dv-2026-0082",
        number: "DV-2026-0082",
        value: 36000,
        dealId: null,
        contactId: "contact-lina-belkacem-open-12",
        companyId: "company-cabinet-dr-gherbi",
        ownerId: "owner-rc",
        sentAt: "2026-09-19",
        expiredAt: "2026-09-25",
        status: "accepte",
        title: "Devis DV-2026-0082"
    },
    {
        id: "quote-dv-2026-0083",
        number: "DV-2026-0083",
        value: 37500,
        dealId: null,
        contactId: "contact-samir-amrani-open-13",
        companyId: "company-clinique-el-ikhlas",
        ownerId: "owner-mt",
        sentAt: "2026-09-20",
        expiredAt: "2026-09-26",
        status: "accepte",
        title: "Devis DV-2026-0083"
    },
    {
        id: "quote-dv-2026-0084",
        number: "DV-2026-0084",
        value: 39000,
        dealId: null,
        contactId: "contact-karim-khelifi-open-14",
        companyId: "company-pharmacie-el-quds",
        ownerId: "owner-sk",
        sentAt: "2026-09-21",
        expiredAt: "2026-09-27",
        status: "accepte",
        title: "Devis DV-2026-0084"
    },
    {
        id: "quote-dv-2026-0085",
        number: "DV-2026-0085",
        value: 40500,
        dealId: null,
        contactId: "contact-yanis-messaoudi-open-15",
        companyId: "company-laboratoire-el-amal",
        ownerId: "owner-eo",
        sentAt: "2026-09-22",
        expiredAt: "2026-09-28",
        status: "accepte",
        title: "Devis DV-2026-0085"
    },
    {
        id: "quote-dv-2026-0086",
        number: "DV-2026-0086",
        value: 42000,
        dealId: null,
        contactId: "contact-nour-hamdi-open-16",
        companyId: "company-cabinet-dr-lounis",
        ownerId: "owner-rc",
        sentAt: "2026-09-23",
        expiredAt: "2026-09-21",
        status: "accepte",
        title: "Devis DV-2026-0086"
    },
    {
        id: "quote-dv-2026-0087",
        number: "DV-2026-0087",
        value: 43500,
        dealId: null,
        contactId: "contact-bilal-belaid-open-17",
        companyId: "company-clinique-el-massara",
        ownerId: "owner-mt",
        sentAt: "2026-09-24",
        expiredAt: "2026-09-22",
        status: "accepte",
        title: "Devis DV-2026-0087"
    },
    {
        id: "quote-dv-2026-0088",
        number: "DV-2026-0088",
        value: 45000,
        dealId: null,
        contactId: "contact-ines-benkhaled-open-18",
        companyId: "company-polyclinique-el-andalous",
        ownerId: "owner-sk",
        sentAt: "2026-09-25",
        expiredAt: "2026-09-23",
        status: "accepte",
        title: "Devis DV-2026-0088"
    }
];

export const leads: Lead[] = [
    {
        id: "lead-amine-benali",
        contactId: "contact-amine-benali",
        companyId: "company-clinique-el-djazair",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-03",
        inbox: true,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-modernisation-crm"
    },
    {
        id: "lead-lina-haddad",
        contactId: "contact-lina-haddad",
        companyId: "company-hopital-ibn-sina",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-04",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-crm-support"
    },
    {
        id: "lead-samir-belkacem",
        contactId: "contact-samir-belkacem",
        companyId: "company-cabinet-dr-amrani",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-05",
        inbox: false,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-digitalisation"
    },
    {
        id: "lead-karim-mansouri",
        contactId: "contact-karim-mansouri",
        companyId: "company-pharmacie-centrale",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-06",
        inbox: false,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-solution-commerciale"
    },
    {
        id: "lead-nadia-khelifi",
        contactId: "contact-nadia-khelifi",
        companyId: "company-clinique-el-yasmin",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-02",
        inbox: false,
        ownerId: "owner-eo",
        status: "converti",
        dealId: "deal-deploiement-national"
    },
    {
        id: "lead-youcef-rahali",
        contactId: "contact-youcef-rahali",
        companyId: "company-groupe-sante-atlas",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-07",
        inbox: false,
        ownerId: "owner-rc",
        status: "converti",
        dealId: "deal-plateforme-commerciale"
    },
    {
        id: "lead-imane-boudiaf",
        contactId: "contact-imane-boudiaf",
        companyId: "company-labo-ibn-rochd",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        inbox: false,
        ownerId: "owner-mt",
        status: "converti",
        dealId: "deal-crm-laboratoire"
    },
    {
        id: "lead-anis-messaoudi-wa-lost-1",
        contactId: "contact-anis-messaoudi-wa-lost-1",
        companyId: "company-clinique-el-wafa",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        inbox: true,
        ownerId: "owner-eo",
        status: "perdu",
        dealId: "deal-wa-lost-1-08"
    },
    {
        id: "lead-kahina-hamdi-wa-lost-2",
        contactId: "contact-kahina-hamdi-wa-lost-2",
        companyId: "company-cabinet-dr-boudiaf",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-rc",
        status: "perdu",
        dealId: "deal-wa-lost-2-09"
    },
    {
        id: "lead-reda-belaid-wa-lost-3",
        contactId: "contact-reda-belaid-wa-lost-3",
        companyId: "company-pharmacie-el-amel",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-08",
        inbox: true,
        ownerId: "owner-mt",
        status: "perdu",
        dealId: "deal-wa-lost-3-10"
    },
    {
        id: "lead-imane-benkhaled-wa-lost-4",
        contactId: "contact-imane-benkhaled-wa-lost-4",
        companyId: "company-polyclinique-el-hidhab",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-09",
        inbox: true,
        ownerId: "owner-sk",
        status: "perdu",
        dealId: "deal-wa-lost-4-11"
    },
    {
        id: "lead-hakim-lounis-wa-lost-5",
        contactId: "contact-hakim-lounis-wa-lost-5",
        companyId: "company-centre-dentaire-lumiere",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-11",
        inbox: true,
        ownerId: "owner-eo",
        status: "perdu",
        dealId: "deal-wa-lost-5-12"
    },
    {
        id: "lead-nadia-kaci-wa-lost-6",
        contactId: "contact-nadia-kaci-wa-lost-6",
        companyId: "company-clinique-el-amel",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-13",
        inbox: true,
        ownerId: "owner-rc",
        status: "perdu",
        dealId: "deal-wa-lost-6-13"
    },
    {
        id: "lead-lotfi-mansouri-wa-lost-7",
        contactId: "contact-lotfi-mansouri-wa-lost-7",
        companyId: "company-laboratoire-el-hikma",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-14",
        inbox: true,
        ownerId: "owner-mt",
        status: "perdu",
        dealId: "deal-wa-lost-7-14"
    },
    {
        id: "lead-salima-benali-wa-lost-8",
        contactId: "contact-salima-benali-wa-lost-8",
        companyId: "company-cabinet-dr-ziani",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-21",
        inbox: true,
        ownerId: "owner-sk",
        status: "perdu",
        dealId: "deal-wa-lost-8-15"
    },
    {
        id: "lead-youcef-boudiaf-site-lost-1",
        contactId: "contact-youcef-boudiaf-site-lost-1",
        companyId: "company-pharmacie-ibn-khaldoun",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-04",
        inbox: true,
        ownerId: "owner-eo",
        status: "perdu",
        dealId: "deal-site-lost-1-16"
    },
    {
        id: "lead-fella-ziani-site-lost-2",
        contactId: "contact-fella-ziani-site-lost-2",
        companyId: "company-clinique-el-nour",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-07",
        inbox: true,
        ownerId: "owner-rc",
        status: "perdu",
        dealId: "deal-site-lost-2-17"
    },
    {
        id: "lead-karim-cherif-site-lost-3",
        contactId: "contact-karim-cherif-site-lost-3",
        companyId: "company-hopital-el-massira",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-10",
        inbox: true,
        ownerId: "owner-mt",
        status: "perdu",
        dealId: "deal-site-lost-3-18"
    },
    {
        id: "lead-rania-touati-ig-lost-1",
        contactId: "contact-rania-touati-ig-lost-1",
        companyId: "company-cabinet-dr-hamdi",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-sk",
        status: "perdu",
        dealId: "deal-ig-lost-1-19"
    },
    {
        id: "lead-omar-ait-ali-ig-lost-2",
        contactId: "contact-omar-ait-ali-ig-lost-2",
        companyId: "company-clinique-el-qods",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-12",
        inbox: true,
        ownerId: "owner-eo",
        status: "perdu",
        dealId: "deal-ig-lost-2-20"
    },
    {
        id: "lead-celine-oussedik-oran-lost-1",
        contactId: "contact-celine-oussedik-oran-lost-1",
        companyId: "company-centre-medical-atlas",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-10",
        inbox: true,
        ownerId: "owner-rc",
        status: "perdu",
        dealId: "deal-oran-lost-1-21"
    },
    {
        id: "lead-mounir-benyahia-open-1",
        contactId: "contact-mounir-benyahia-open-1",
        companyId: "company-pharmacie-el-feth",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-09",
        inbox: false,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-1-22"
    },
    {
        id: "lead-wafa-ouadah-open-2",
        contactId: "contact-wafa-ouadah-open-2",
        companyId: "company-cabinet-dr-saadi",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-10",
        inbox: false,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-open-2-23"
    },
    {
        id: "lead-samy-haddad-open-3",
        contactId: "contact-samy-haddad-open-3",
        companyId: "company-clinique-el-rahma",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-11",
        inbox: false,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-open-3-24"
    },
    {
        id: "lead-leila-ibrahim-open-4",
        contactId: "contact-leila-ibrahim-open-4",
        companyId: "company-polyclinique-el-bassatine",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-12",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-open-4-25"
    },
    {
        id: "lead-bilel-rahal-open-5",
        contactId: "contact-bilel-rahal-open-5",
        companyId: "company-laboratoire-el-chifa",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-13",
        inbox: true,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-5-26"
    },
    {
        id: "lead-asma-bouaziz-open-6",
        contactId: "contact-asma-bouaziz-open-6",
        companyId: "company-cabinet-dr-touati",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-14",
        inbox: false,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-open-6-27"
    },
    {
        id: "lead-nassim-saadi-open-7",
        contactId: "contact-nassim-saadi-open-7",
        companyId: "company-clinique-el-hayat",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-15",
        inbox: false,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-open-7-28"
    },
    {
        id: "lead-hayat-gherbi-open-8",
        contactId: "contact-hayat-gherbi-open-8",
        companyId: "company-pharmacie-el-hikmat",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-open-8-29"
    },
    {
        id: "lead-zakaria-djebbar-open-9",
        contactId: "contact-zakaria-djebbar-open-9",
        companyId: "company-centre-ophtalmo-el-nour",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-16",
        inbox: true,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-9-30"
    },
    {
        id: "lead-sihem-mokrani-open-10",
        contactId: "contact-sihem-mokrani-open-10",
        companyId: "company-clinique-el-baraka",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-17",
        inbox: false,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-open-10-31"
    },
    {
        id: "lead-amine-taleb-open-11",
        contactId: "contact-amine-taleb-open-11",
        companyId: "company-hopital-el-farabi",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-18",
        inbox: false,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-open-11-32"
    },
    {
        id: "lead-lina-belkacem-open-12",
        contactId: "contact-lina-belkacem-open-12",
        companyId: "company-cabinet-dr-gherbi",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-19",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-open-12-33"
    },
    {
        id: "lead-samir-amrani-open-13",
        contactId: "contact-samir-amrani-open-13",
        companyId: "company-clinique-el-ikhlas",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-07",
        inbox: false,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-13-34"
    },
    {
        id: "lead-karim-khelifi-open-14",
        contactId: "contact-karim-khelifi-open-14",
        companyId: "company-pharmacie-el-quds",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-20",
        inbox: true,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-open-14-35"
    },
    {
        id: "lead-yanis-messaoudi-open-15",
        contactId: "contact-yanis-messaoudi-open-15",
        companyId: "company-laboratoire-el-amal",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-21",
        inbox: false,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-open-15-36"
    },
    {
        id: "lead-nour-hamdi-open-16",
        contactId: "contact-nour-hamdi-open-16",
        companyId: "company-cabinet-dr-lounis",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-22",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-open-16-37"
    },
    {
        id: "lead-bilal-belaid-open-17",
        contactId: "contact-bilal-belaid-open-17",
        companyId: "company-clinique-el-massara",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-23",
        inbox: false,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-17-38"
    },
    {
        id: "lead-ines-benkhaled-open-18",
        contactId: "contact-ines-benkhaled-open-18",
        companyId: "company-polyclinique-el-andalous",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-sk",
        status: "qualifie",
        dealId: "deal-open-18-39"
    },
    {
        id: "lead-sofiane-lounis-open-19",
        contactId: "contact-sofiane-lounis-open-19",
        companyId: "company-centre-cardio-el-djazair",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-24",
        inbox: false,
        ownerId: "owner-eo",
        status: "qualifie",
        dealId: "deal-open-19-40"
    },
    {
        id: "lead-yasmine-kaci-open-20",
        contactId: "contact-yasmine-kaci-open-20",
        companyId: "company-cabinet-dr-mokrani",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-25",
        inbox: false,
        ownerId: "owner-rc",
        status: "qualifie",
        dealId: "deal-open-20-41"
    },
    {
        id: "lead-riad-mansouri-open-21",
        contactId: "contact-riad-mansouri-open-21",
        companyId: "company-clinique-el-houda",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-26",
        inbox: false,
        ownerId: "owner-mt",
        status: "qualifie",
        dealId: "deal-open-21-42"
    },
    {
        id: "lead-fill-whatsapp-1",
        contactId: "contact-lead-whatsapp-1",
        companyId: "company-clinique-el-wafa",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-04",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-2",
        contactId: "contact-lead-whatsapp-2",
        companyId: "company-cabinet-dr-boudiaf",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-3",
        contactId: "contact-lead-whatsapp-3",
        companyId: "company-pharmacie-el-amel",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-4",
        contactId: "contact-lead-whatsapp-4",
        companyId: "company-polyclinique-el-hidhab",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-07",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-5",
        contactId: "contact-lead-whatsapp-5",
        companyId: "company-centre-dentaire-lumiere",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-08",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-6",
        contactId: "contact-lead-whatsapp-6",
        companyId: "company-clinique-el-amel",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-09",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-7",
        contactId: "contact-lead-whatsapp-7",
        companyId: "company-laboratoire-el-hikma",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-10",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-8",
        contactId: "contact-lead-whatsapp-8",
        companyId: "company-cabinet-dr-ziani",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-11",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-9",
        contactId: "contact-lead-whatsapp-9",
        companyId: "company-pharmacie-ibn-khaldoun",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-12",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-10",
        contactId: "contact-lead-whatsapp-10",
        companyId: "company-clinique-el-nour",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-13",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-11",
        contactId: "contact-lead-whatsapp-11",
        companyId: "company-hopital-el-massira",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-14",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-12",
        contactId: "contact-lead-whatsapp-12",
        companyId: "company-cabinet-dr-hamdi",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-15",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-13",
        contactId: "contact-lead-whatsapp-13",
        companyId: "company-clinique-el-qods",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-16",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-14",
        contactId: "contact-lead-whatsapp-14",
        companyId: "company-centre-medical-atlas",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-17",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-15",
        contactId: "contact-lead-whatsapp-15",
        companyId: "company-pharmacie-el-feth",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-18",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-16",
        contactId: "contact-lead-whatsapp-16",
        companyId: "company-cabinet-dr-saadi",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-19",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-17",
        contactId: "contact-lead-whatsapp-17",
        companyId: "company-clinique-el-rahma",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-20",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-18",
        contactId: "contact-lead-whatsapp-18",
        companyId: "company-polyclinique-el-bassatine",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-21",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-19",
        contactId: "contact-lead-whatsapp-19",
        companyId: "company-laboratoire-el-chifa",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-22",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-20",
        contactId: "contact-lead-whatsapp-20",
        companyId: "company-cabinet-dr-touati",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-23",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-21",
        contactId: "contact-lead-whatsapp-21",
        companyId: "company-clinique-el-hayat",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-24",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-22",
        contactId: "contact-lead-whatsapp-22",
        companyId: "company-pharmacie-el-hikmat",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-25",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-23",
        contactId: "contact-lead-whatsapp-23",
        companyId: "company-centre-ophtalmo-el-nour",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-26",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-24",
        contactId: "contact-lead-whatsapp-24",
        companyId: "company-clinique-el-baraka",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-27",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-25",
        contactId: "contact-lead-whatsapp-25",
        companyId: "company-hopital-el-farabi",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-28",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-26",
        contactId: "contact-lead-whatsapp-26",
        companyId: "company-cabinet-dr-gherbi",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-29",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-27",
        contactId: "contact-lead-whatsapp-27",
        companyId: "company-clinique-el-ikhlas",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-30",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-28",
        contactId: "contact-lead-whatsapp-28",
        companyId: "company-pharmacie-el-quds",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-01",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-29",
        contactId: "contact-lead-whatsapp-29",
        companyId: "company-laboratoire-el-amal",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-02",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-30",
        contactId: "contact-lead-whatsapp-30",
        companyId: "company-cabinet-dr-lounis",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-03",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-31",
        contactId: "contact-lead-whatsapp-31",
        companyId: "company-clinique-el-massara",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-04",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-32",
        contactId: "contact-lead-whatsapp-32",
        companyId: "company-polyclinique-el-andalous",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-05",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-whatsapp-33",
        contactId: "contact-lead-whatsapp-33",
        companyId: "company-centre-cardio-el-djazair",
        source: "whatsapp",
        sourceCampaignId: "campaign-wa-cliniques-alger",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-34",
        contactId: "contact-lead-site_web-34",
        companyId: "company-cabinet-dr-mokrani",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-07",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-35",
        contactId: "contact-lead-site_web-35",
        companyId: "company-clinique-el-houda",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-08",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-36",
        contactId: "contact-lead-site_web-36",
        companyId: "company-clinique-el-wafa",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-09",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-37",
        contactId: "contact-lead-site_web-37",
        companyId: "company-cabinet-dr-boudiaf",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-10",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-38",
        contactId: "contact-lead-site_web-38",
        companyId: "company-pharmacie-el-amel",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-11",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-39",
        contactId: "contact-lead-site_web-39",
        companyId: "company-polyclinique-el-hidhab",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-12",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-40",
        contactId: "contact-lead-site_web-40",
        companyId: "company-centre-dentaire-lumiere",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-13",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-41",
        contactId: "contact-lead-site_web-41",
        companyId: "company-clinique-el-amel",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-14",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-42",
        contactId: "contact-lead-site_web-42",
        companyId: "company-laboratoire-el-hikma",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-15",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-43",
        contactId: "contact-lead-site_web-43",
        companyId: "company-cabinet-dr-ziani",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-16",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-44",
        contactId: "contact-lead-site_web-44",
        companyId: "company-pharmacie-ibn-khaldoun",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-17",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-45",
        contactId: "contact-lead-site_web-45",
        companyId: "company-clinique-el-nour",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-18",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-46",
        contactId: "contact-lead-site_web-46",
        companyId: "company-hopital-el-massira",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-19",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-47",
        contactId: "contact-lead-site_web-47",
        companyId: "company-cabinet-dr-hamdi",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-20",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-48",
        contactId: "contact-lead-site_web-48",
        companyId: "company-clinique-el-qods",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-21",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-49",
        contactId: "contact-lead-site_web-49",
        companyId: "company-centre-medical-atlas",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-22",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-50",
        contactId: "contact-lead-site_web-50",
        companyId: "company-pharmacie-el-feth",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-23",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-51",
        contactId: "contact-lead-site_web-51",
        companyId: "company-cabinet-dr-saadi",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-24",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-52",
        contactId: "contact-lead-site_web-52",
        companyId: "company-clinique-el-rahma",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-25",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-53",
        contactId: "contact-lead-site_web-53",
        companyId: "company-polyclinique-el-bassatine",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-26",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-54",
        contactId: "contact-lead-site_web-54",
        companyId: "company-laboratoire-el-chifa",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-27",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-site_web-55",
        contactId: "contact-lead-site_web-55",
        companyId: "company-cabinet-dr-touati",
        source: "site_web",
        sourceCampaignId: "campaign-devis-crm-sante",
        createdAt: "2026-09-28",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-56",
        contactId: "contact-lead-instagram-56",
        companyId: "company-clinique-el-hayat",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-29",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-57",
        contactId: "contact-lead-instagram-57",
        companyId: "company-pharmacie-el-hikmat",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-30",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-58",
        contactId: "contact-lead-instagram-58",
        companyId: "company-centre-ophtalmo-el-nour",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-01",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-59",
        contactId: "contact-lead-instagram-59",
        companyId: "company-clinique-el-baraka",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-02",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-60",
        contactId: "contact-lead-instagram-60",
        companyId: "company-hopital-el-farabi",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-03",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-61",
        contactId: "contact-lead-instagram-61",
        companyId: "company-cabinet-dr-gherbi",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-04",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-62",
        contactId: "contact-lead-instagram-62",
        companyId: "company-clinique-el-ikhlas",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-05",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-63",
        contactId: "contact-lead-instagram-63",
        companyId: "company-pharmacie-el-quds",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-06",
        inbox: true,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-64",
        contactId: "contact-lead-instagram-64",
        companyId: "company-laboratoire-el-amal",
        source: "instagram",
        sourceCampaignId: "campaign-retargeting-devis",
        createdAt: "2026-09-07",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-instagram-65",
        contactId: "contact-lead-instagram-65",
        companyId: "company-cabinet-dr-lounis",
        source: "instagram",
        sourceCampaignId: null,
        createdAt: "2026-09-08",
        inbox: false,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-66",
        contactId: "contact-lead-recommandation-66",
        companyId: "company-clinique-el-massara",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-09",
        inbox: false,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-67",
        contactId: "contact-lead-recommandation-67",
        companyId: "company-polyclinique-el-andalous",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-10",
        inbox: false,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-68",
        contactId: "contact-lead-recommandation-68",
        companyId: "company-centre-cardio-el-djazair",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-11",
        inbox: false,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-69",
        contactId: "contact-lead-recommandation-69",
        companyId: "company-cabinet-dr-mokrani",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-12",
        inbox: false,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-70",
        contactId: "contact-lead-recommandation-70",
        companyId: "company-clinique-el-houda",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-13",
        inbox: false,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-71",
        contactId: "contact-lead-recommandation-71",
        companyId: "company-clinique-el-wafa",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-14",
        inbox: false,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-72",
        contactId: "contact-lead-recommandation-72",
        companyId: "company-cabinet-dr-boudiaf",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-15",
        inbox: false,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-recommandation-73",
        contactId: "contact-lead-recommandation-73",
        companyId: "company-pharmacie-el-amel",
        source: "recommandation",
        sourceCampaignId: null,
        createdAt: "2026-09-16",
        inbox: false,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-74",
        contactId: "contact-lead-email-74",
        companyId: "company-polyclinique-el-hidhab",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-17",
        inbox: false,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-75",
        contactId: "contact-lead-email-75",
        companyId: "company-centre-dentaire-lumiere",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-18",
        inbox: false,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-76",
        contactId: "contact-lead-email-76",
        companyId: "company-clinique-el-amel",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-19",
        inbox: false,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-77",
        contactId: "contact-lead-email-77",
        companyId: "company-laboratoire-el-hikma",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-20",
        inbox: false,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-78",
        contactId: "contact-lead-email-78",
        companyId: "company-cabinet-dr-ziani",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-21",
        inbox: false,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-email-79",
        contactId: "contact-lead-email-79",
        companyId: "company-pharmacie-ibn-khaldoun",
        source: "email",
        sourceCampaignId: null,
        createdAt: "2026-09-22",
        inbox: false,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-80",
        contactId: "contact-lead-autres-80",
        companyId: "company-clinique-el-nour",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-23",
        inbox: true,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-81",
        contactId: "contact-lead-autres-81",
        companyId: "company-hopital-el-massira",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-24",
        inbox: true,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-82",
        contactId: "contact-lead-autres-82",
        companyId: "company-cabinet-dr-hamdi",
        source: "autres",
        sourceCampaignId: "campaign-prospecting-oran",
        createdAt: "2026-09-25",
        inbox: true,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-83",
        contactId: "contact-lead-autres-83",
        companyId: "company-clinique-el-qods",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-26",
        inbox: false,
        ownerId: "owner-mt",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-84",
        contactId: "contact-lead-autres-84",
        companyId: "company-centre-medical-atlas",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-27",
        inbox: false,
        ownerId: "owner-sk",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-85",
        contactId: "contact-lead-autres-85",
        companyId: "company-pharmacie-el-feth",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-28",
        inbox: false,
        ownerId: "owner-eo",
        status: "nouveau",
        dealId: null
    },
    {
        id: "lead-fill-autres-86",
        contactId: "contact-lead-autres-86",
        companyId: "company-cabinet-dr-saadi",
        source: "autres",
        sourceCampaignId: null,
        createdAt: "2026-09-29",
        inbox: false,
        ownerId: "owner-rc",
        status: "nouveau",
        dealId: null
    }
];

export const dailyAdPerformance: DailyAdPerformance[] = [
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-01",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-01",
        spend: 6659,
        leads: 2,
        impressions: 2886,
        clicks: 65
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-02",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-02",
        spend: 6332,
        leads: 1,
        impressions: 2744,
        clicks: 62
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-03",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-03",
        spend: 5567,
        leads: 1,
        impressions: 2413,
        clicks: 55
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-04",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-04",
        spend: 2292,
        leads: 1,
        impressions: 993,
        clicks: 22
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-05",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-05",
        spend: 1747,
        leads: 0,
        impressions: 757,
        clicks: 17
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-06",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-06",
        spend: 4789,
        leads: 1,
        impressions: 2075,
        clicks: 47
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-07",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-07",
        spend: 8918,
        leads: 2,
        impressions: 3864,
        clicks: 88
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-08",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-08",
        spend: 10074,
        leads: 2,
        impressions: 4365,
        clicks: 99
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-09",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-09",
        spend: 9579,
        leads: 2,
        impressions: 4151,
        clicks: 94
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-10",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-10",
        spend: 8423,
        leads: 2,
        impressions: 3650,
        clicks: 83
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-11",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-11",
        spend: 3468,
        leads: 1,
        impressions: 1503,
        clicks: 34
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-12",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-12",
        spend: 2642,
        leads: 1,
        impressions: 1145,
        clicks: 26
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-13",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-13",
        spend: 4221,
        leads: 1,
        impressions: 1829,
        clicks: 41
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-14",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-14",
        spend: 7860,
        leads: 2,
        impressions: 3406,
        clicks: 77
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-15",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-15",
        spend: 8879,
        leads: 2,
        impressions: 3847,
        clicks: 87
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-16",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-16",
        spend: 8442,
        leads: 2,
        impressions: 3658,
        clicks: 83
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-17",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-17",
        spend: 7423,
        leads: 2,
        impressions: 3217,
        clicks: 73
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-18",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-18",
        spend: 3057,
        leads: 1,
        impressions: 1325,
        clicks: 30
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-19",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-19",
        spend: 2329,
        leads: 1,
        impressions: 1009,
        clicks: 23
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-20",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-20",
        spend: 4221,
        leads: 1,
        impressions: 1829,
        clicks: 41
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-21",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-21",
        spend: 6500,
        leads: 1,
        impressions: 2816,
        clicks: 64
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-22",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-22",
        spend: 7342,
        leads: 2,
        impressions: 3182,
        clicks: 72
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-23",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-23",
        spend: 6981,
        leads: 2,
        impressions: 3025,
        clicks: 68
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-24",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-24",
        spend: 6138,
        leads: 1,
        impressions: 2660,
        clicks: 60
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-25",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-25",
        spend: 2528,
        leads: 1,
        impressions: 1095,
        clicks: 25
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-26",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-26",
        spend: 1926,
        leads: 0,
        impressions: 835,
        clicks: 19
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-27",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-27",
        spend: 4546,
        leads: 1,
        impressions: 1970,
        clicks: 45
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-28",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-28",
        spend: 8464,
        leads: 2,
        impressions: 3668,
        clicks: 83
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-29",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-29",
        spend: 9562,
        leads: 2,
        impressions: 4143,
        clicks: 94
    },
    {
        id: "stat-campaign-wa-cliniques-alger-2026-09-30",
        campaignId: "campaign-wa-cliniques-alger",
        date: "2026-09-30",
        spend: 9091,
        leads: 2,
        impressions: 3940,
        clicks: 89
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-01",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-01",
        spend: 5179,
        leads: 1,
        impressions: 2244,
        clicks: 51
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-02",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-02",
        spend: 4925,
        leads: 1,
        impressions: 2134,
        clicks: 48
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-03",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-03",
        spend: 4330,
        leads: 1,
        impressions: 1876,
        clicks: 42
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-04",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-04",
        spend: 1783,
        leads: 0,
        impressions: 773,
        clicks: 18
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-05",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-05",
        spend: 1359,
        leads: 0,
        impressions: 589,
        clicks: 13
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-06",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-06",
        spend: 3725,
        leads: 1,
        impressions: 1614,
        clicks: 37
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-07",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-07",
        spend: 6936,
        leads: 1,
        impressions: 3006,
        clicks: 68
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-08",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-08",
        spend: 7835,
        leads: 2,
        impressions: 3395,
        clicks: 77
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-09",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-09",
        spend: 7450,
        leads: 2,
        impressions: 3228,
        clicks: 73
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-10",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-10",
        spend: 6551,
        leads: 1,
        impressions: 2839,
        clicks: 64
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-11",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-11",
        spend: 2697,
        leads: 1,
        impressions: 1169,
        clicks: 26
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-12",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-12",
        spend: 2055,
        leads: 0,
        impressions: 891,
        clicks: 20
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-13",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-13",
        spend: 3283,
        leads: 1,
        impressions: 1423,
        clicks: 32
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-14",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-14",
        spend: 6113,
        leads: 1,
        impressions: 2649,
        clicks: 60
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-15",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-15",
        spend: 6906,
        leads: 1,
        impressions: 2992,
        clicks: 68
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-16",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-16",
        spend: 6566,
        leads: 1,
        impressions: 2845,
        clicks: 64
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-17",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-17",
        spend: 5774,
        leads: 1,
        impressions: 2502,
        clicks: 57
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-18",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-18",
        spend: 2377,
        leads: 1,
        impressions: 1030,
        clicks: 23
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-19",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-19",
        spend: 1811,
        leads: 0,
        impressions: 785,
        clicks: 18
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-20",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-20",
        spend: 3283,
        leads: 1,
        impressions: 1423,
        clicks: 32
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-21",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-21",
        spend: 5055,
        leads: 1,
        impressions: 2191,
        clicks: 50
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-22",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-22",
        spend: 5711,
        leads: 1,
        impressions: 2474,
        clicks: 56
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-23",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-23",
        spend: 5430,
        leads: 1,
        impressions: 2353,
        clicks: 53
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-24",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-24",
        spend: 4774,
        leads: 1,
        impressions: 2069,
        clicks: 47
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-25",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-25",
        spend: 1966,
        leads: 0,
        impressions: 852,
        clicks: 19
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-26",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-26",
        spend: 1498,
        leads: 0,
        impressions: 649,
        clicks: 15
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-27",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-27",
        spend: 3536,
        leads: 1,
        impressions: 1532,
        clicks: 35
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-28",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-28",
        spend: 6584,
        leads: 1,
        impressions: 2853,
        clicks: 65
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-29",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-29",
        spend: 7437,
        leads: 2,
        impressions: 3223,
        clicks: 73
    },
    {
        id: "stat-campaign-devis-crm-sante-2026-09-30",
        campaignId: "campaign-devis-crm-sante",
        date: "2026-09-30",
        spend: 7071,
        leads: 2,
        impressions: 3064,
        clicks: 69
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-01",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-01",
        spend: 2590,
        leads: 0,
        impressions: 1122,
        clicks: 25
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-02",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-02",
        spend: 2462,
        leads: 0,
        impressions: 1067,
        clicks: 24
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-03",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-03",
        spend: 2165,
        leads: 0,
        impressions: 938,
        clicks: 21
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-04",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-04",
        spend: 891,
        leads: 0,
        impressions: 386,
        clicks: 9
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-05",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-05",
        spend: 679,
        leads: 0,
        impressions: 294,
        clicks: 7
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-06",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-06",
        spend: 1862,
        leads: 0,
        impressions: 807,
        clicks: 18
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-07",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-07",
        spend: 3468,
        leads: 1,
        impressions: 1503,
        clicks: 34
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-08",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-08",
        spend: 3918,
        leads: 1,
        impressions: 1698,
        clicks: 39
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-09",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-09",
        spend: 3725,
        leads: 1,
        impressions: 1614,
        clicks: 37
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-10",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-10",
        spend: 3275,
        leads: 1,
        impressions: 1419,
        clicks: 32
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-11",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-11",
        spend: 1349,
        leads: 0,
        impressions: 585,
        clicks: 13
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-12",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-12",
        spend: 1028,
        leads: 0,
        impressions: 445,
        clicks: 10
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-13",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-13",
        spend: 1641,
        leads: 0,
        impressions: 711,
        clicks: 16
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-14",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-14",
        spend: 3057,
        leads: 1,
        impressions: 1325,
        clicks: 30
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-15",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-15",
        spend: 3453,
        leads: 1,
        impressions: 1496,
        clicks: 34
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-16",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-16",
        spend: 3283,
        leads: 1,
        impressions: 1423,
        clicks: 32
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-17",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-17",
        spend: 2887,
        leads: 1,
        impressions: 1251,
        clicks: 28
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-18",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-18",
        spend: 1189,
        leads: 0,
        impressions: 515,
        clicks: 12
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-19",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-19",
        spend: 906,
        leads: 0,
        impressions: 393,
        clicks: 9
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-20",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-20",
        spend: 1641,
        leads: 0,
        impressions: 711,
        clicks: 16
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-21",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-21",
        spend: 2528,
        leads: 0,
        impressions: 1095,
        clicks: 25
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-22",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-22",
        spend: 2855,
        leads: 1,
        impressions: 1237,
        clicks: 28
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-23",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-23",
        spend: 2715,
        leads: 0,
        impressions: 1177,
        clicks: 27
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-24",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-24",
        spend: 2387,
        leads: 0,
        impressions: 1035,
        clicks: 23
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-25",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-25",
        spend: 983,
        leads: 0,
        impressions: 426,
        clicks: 10
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-26",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-26",
        spend: 749,
        leads: 0,
        impressions: 325,
        clicks: 7
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-27",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-27",
        spend: 1768,
        leads: 0,
        impressions: 766,
        clicks: 17
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-28",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-28",
        spend: 3292,
        leads: 1,
        impressions: 1426,
        clicks: 32
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-29",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-29",
        spend: 3718,
        leads: 1,
        impressions: 1611,
        clicks: 37
    },
    {
        id: "stat-campaign-retargeting-devis-2026-09-30",
        campaignId: "campaign-retargeting-devis",
        date: "2026-09-30",
        spend: 3536,
        leads: 1,
        impressions: 1532,
        clicks: 35
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-01",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-01",
        spend: 1110,
        leads: 0,
        impressions: 481,
        clicks: 11
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-02",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-02",
        spend: 1055,
        leads: 0,
        impressions: 457,
        clicks: 10
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-03",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-03",
        spend: 928,
        leads: 0,
        impressions: 402,
        clicks: 9
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-04",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-04",
        spend: 382,
        leads: 0,
        impressions: 166,
        clicks: 4
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-05",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-05",
        spend: 291,
        leads: 0,
        impressions: 126,
        clicks: 3
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-06",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-06",
        spend: 798,
        leads: 0,
        impressions: 346,
        clicks: 8
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-07",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-07",
        spend: 1486,
        leads: 0,
        impressions: 644,
        clicks: 14
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-08",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-08",
        spend: 1679,
        leads: 1,
        impressions: 728,
        clicks: 16
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-09",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-09",
        spend: 1596,
        leads: 1,
        impressions: 692,
        clicks: 16
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-10",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-10",
        spend: 1404,
        leads: 0,
        impressions: 608,
        clicks: 14
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-11",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-11",
        spend: 578,
        leads: 0,
        impressions: 250,
        clicks: 6
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-12",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-12",
        spend: 440,
        leads: 0,
        impressions: 191,
        clicks: 4
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-13",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-13",
        spend: 704,
        leads: 0,
        impressions: 305,
        clicks: 7
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-14",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-14",
        spend: 1310,
        leads: 0,
        impressions: 568,
        clicks: 13
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-15",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-15",
        spend: 1480,
        leads: 0,
        impressions: 641,
        clicks: 14
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-16",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-16",
        spend: 1407,
        leads: 0,
        impressions: 610,
        clicks: 14
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-17",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-17",
        spend: 1237,
        leads: 0,
        impressions: 536,
        clicks: 12
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-18",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-18",
        spend: 509,
        leads: 0,
        impressions: 221,
        clicks: 5
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-19",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-19",
        spend: 388,
        leads: 0,
        impressions: 168,
        clicks: 4
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-20",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-20",
        spend: 704,
        leads: 0,
        impressions: 305,
        clicks: 7
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-21",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-21",
        spend: 1083,
        leads: 0,
        impressions: 469,
        clicks: 11
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-22",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-22",
        spend: 1224,
        leads: 0,
        impressions: 530,
        clicks: 12
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-23",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-23",
        spend: 1164,
        leads: 0,
        impressions: 504,
        clicks: 11
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-24",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-24",
        spend: 1023,
        leads: 0,
        impressions: 443,
        clicks: 10
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-25",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-25",
        spend: 421,
        leads: 0,
        impressions: 183,
        clicks: 4
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-26",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-26",
        spend: 321,
        leads: 0,
        impressions: 139,
        clicks: 3
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-27",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-27",
        spend: 758,
        leads: 0,
        impressions: 328,
        clicks: 7
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-28",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-28",
        spend: 1411,
        leads: 0,
        impressions: 611,
        clicks: 14
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-29",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-29",
        spend: 1594,
        leads: 1,
        impressions: 691,
        clicks: 16
    },
    {
        id: "stat-campaign-prospecting-oran-2026-09-30",
        campaignId: "campaign-prospecting-oran",
        date: "2026-09-30",
        spend: 1515,
        leads: 1,
        impressions: 657,
        clicks: 15
    }
];

export const conversations: Conversation[] = [
    {
        id: "inbox-amine-benali",
        contactId: "contact-amine-benali",
        companyId: "company-clinique-el-djazair",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Devis DV-2026-0047 - Modernisation CRM",
        lastMessageAt: "2026-09-28T10:24:00+01:00",
        unread: false,
        dealId: "deal-modernisation-crm",
        messages: [
            {
                id: "msg-am-1",
                at: "2026-09-03T09:12:00+01:00",
                from: "contact",
                body: "Bonjour, on cherche à moderniser le suivi commercial de la clinique."
            },
            {
                id: "msg-am-2",
                at: "2026-09-03T09:18:00+01:00",
                from: "owner",
                body: "Bonjour Amine, Elias de EvoCRM. Je vous prépare un cadrage autour de Modernisation CRM."
            },
            {
                id: "msg-am-3",
                at: "2026-09-08T16:02:00+01:00",
                from: "owner",
                body: "Le devis DV-2026-0047 est envoyé: 320 000 DA, en attente de votre retour."
            },
            {
                id: "msg-am-4",
                at: "2026-09-28T10:24:00+01:00",
                from: "contact",
                body: "On le relit avec la direction cette semaine."
            }
        ]
    },
    {
        id: "inbox-lina-haddad",
        contactId: "contact-lina-haddad",
        companyId: "company-hopital-ibn-sina",
        channel: "email",
        campaignId: null,
        subject: "CRM & Support - Hôpital Ibn Sina",
        lastMessageAt: "2026-09-27T15:40:00+01:00",
        unread: true,
        dealId: "deal-crm-support",
        messages: [
            {
                id: "msg-li-1",
                at: "2026-09-04T11:00:00+01:00",
                from: "contact",
                body: "Nadia de El Yasmin vous a recommandés pour un CRM + support."
            },
            {
                id: "msg-li-2",
                at: "2026-09-27T15:40:00+01:00",
                from: "contact",
                body: "Pouvez-vous confirmer le périmètre support 5 jours ?"
            }
        ]
    },
    {
        id: "inbox-samir-belkacem",
        contactId: "contact-samir-belkacem",
        companyId: "company-cabinet-dr-amrani",
        channel: "email",
        campaignId: null,
        subject: "Digitalisation cabinet",
        lastMessageAt: "2026-09-26T09:05:00+01:00",
        unread: false,
        dealId: "deal-digitalisation",
        messages: [
            {
                id: "msg-sa-1",
                at: "2026-09-05T14:22:00+01:00",
                from: "owner",
                body: "Proposition Digitalisation envoyée, 280 000 DA."
            },
            {
                id: "msg-sa-2",
                at: "2026-09-26T09:05:00+01:00",
                from: "contact",
                body: "On valide le devis après la réunion de jeudi."
            }
        ]
    },
    {
        id: "inbox-karim-mansouri",
        contactId: "contact-karim-mansouri",
        companyId: "company-pharmacie-centrale",
        channel: "instagram",
        campaignId: null,
        subject: "Solution commerciale pharmacie",
        lastMessageAt: "2026-09-25T18:11:00+01:00",
        unread: false,
        dealId: "deal-solution-commerciale",
        messages: [
            {
                id: "msg-ka-1",
                at: "2026-09-06T13:40:00+01:00",
                from: "contact",
                body: "Vu votre page, on veut un suivi des appels officine."
            },
            {
                id: "msg-ka-2",
                at: "2026-09-25T18:11:00+01:00",
                from: "owner",
                body: "Négociation ouverte à 150 000 DA."
            }
        ]
    },
    {
        id: "inbox-contact-anis-messaoudi-wa-lost-1",
        contactId: "contact-anis-messaoudi-wa-lost-1",
        companyId: "company-clinique-el-wafa",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-05T11:10:00+01:00",
        unread: true,
        dealId: "deal-wa-lost-1-08",
        messages: [
            {
                id: "msg-contact-anis-messaoudi-wa-lost-1-1",
                at: "2026-09-05T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-anis-messaoudi-wa-lost-1-2",
                at: "2026-09-05T11:10:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-kahina-hamdi-wa-lost-2",
        contactId: "contact-kahina-hamdi-wa-lost-2",
        companyId: "company-cabinet-dr-boudiaf",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-06T11:11:00+01:00",
        unread: false,
        dealId: "deal-wa-lost-2-09",
        messages: [
            {
                id: "msg-contact-kahina-hamdi-wa-lost-2-1",
                at: "2026-09-06T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-kahina-hamdi-wa-lost-2-2",
                at: "2026-09-06T11:11:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-reda-belaid-wa-lost-3",
        contactId: "contact-reda-belaid-wa-lost-3",
        companyId: "company-pharmacie-el-amel",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-08T11:12:00+01:00",
        unread: false,
        dealId: "deal-wa-lost-3-10",
        messages: [
            {
                id: "msg-contact-reda-belaid-wa-lost-3-1",
                at: "2026-09-08T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-reda-belaid-wa-lost-3-2",
                at: "2026-09-08T11:12:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-imane-benkhaled-wa-lost-4",
        contactId: "contact-imane-benkhaled-wa-lost-4",
        companyId: "company-polyclinique-el-hidhab",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-09T11:13:00+01:00",
        unread: true,
        dealId: "deal-wa-lost-4-11",
        messages: [
            {
                id: "msg-contact-imane-benkhaled-wa-lost-4-1",
                at: "2026-09-09T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-imane-benkhaled-wa-lost-4-2",
                at: "2026-09-09T11:13:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-hakim-lounis-wa-lost-5",
        contactId: "contact-hakim-lounis-wa-lost-5",
        companyId: "company-centre-dentaire-lumiere",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-11T11:14:00+01:00",
        unread: false,
        dealId: "deal-wa-lost-5-12",
        messages: [
            {
                id: "msg-contact-hakim-lounis-wa-lost-5-1",
                at: "2026-09-11T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-hakim-lounis-wa-lost-5-2",
                at: "2026-09-11T11:14:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-nadia-kaci-wa-lost-6",
        contactId: "contact-nadia-kaci-wa-lost-6",
        companyId: "company-clinique-el-amel",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-13T11:15:00+01:00",
        unread: false,
        dealId: "deal-wa-lost-6-13",
        messages: [
            {
                id: "msg-contact-nadia-kaci-wa-lost-6-1",
                at: "2026-09-13T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-nadia-kaci-wa-lost-6-2",
                at: "2026-09-13T11:15:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-lotfi-mansouri-wa-lost-7",
        contactId: "contact-lotfi-mansouri-wa-lost-7",
        companyId: "company-laboratoire-el-hikma",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-14T11:16:00+01:00",
        unread: true,
        dealId: "deal-wa-lost-7-14",
        messages: [
            {
                id: "msg-contact-lotfi-mansouri-wa-lost-7-1",
                at: "2026-09-14T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-lotfi-mansouri-wa-lost-7-2",
                at: "2026-09-14T11:16:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-salima-benali-wa-lost-8",
        contactId: "contact-salima-benali-wa-lost-8",
        companyId: "company-cabinet-dr-ziani",
        channel: "whatsapp",
        campaignId: "campaign-wa-cliniques-alger",
        subject: "Lead WA Cliniques Alger",
        lastMessageAt: "2026-09-21T11:17:00+01:00",
        unread: false,
        dealId: "deal-wa-lost-8-15",
        messages: [
            {
                id: "msg-contact-salima-benali-wa-lost-8-1",
                at: "2026-09-21T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-salima-benali-wa-lost-8-2",
                at: "2026-09-21T11:17:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-youcef-boudiaf-site-lost-1",
        contactId: "contact-youcef-boudiaf-site-lost-1",
        companyId: "company-pharmacie-ibn-khaldoun",
        channel: "email",
        campaignId: "campaign-devis-crm-sante",
        subject: "Lead Devis CRM Santé",
        lastMessageAt: "2026-09-04T11:18:00+01:00",
        unread: false,
        dealId: "deal-site-lost-1-16",
        messages: [
            {
                id: "msg-contact-youcef-boudiaf-site-lost-1-1",
                at: "2026-09-04T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-youcef-boudiaf-site-lost-1-2",
                at: "2026-09-04T11:18:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    },
    {
        id: "inbox-contact-fella-ziani-site-lost-2",
        contactId: "contact-fella-ziani-site-lost-2",
        companyId: "company-clinique-el-nour",
        channel: "email",
        campaignId: "campaign-devis-crm-sante",
        subject: "Lead Devis CRM Santé",
        lastMessageAt: "2026-09-07T11:19:00+01:00",
        unread: true,
        dealId: "deal-site-lost-2-17",
        messages: [
            {
                id: "msg-contact-fella-ziani-site-lost-2-1",
                at: "2026-09-07T10:02:00+01:00",
                from: "contact",
                body: "Je veux un devis CRM pour notre structure."
            },
            {
                id: "msg-contact-fella-ziani-site-lost-2-2",
                at: "2026-09-07T11:19:00+01:00",
                from: "owner",
                body: "Bien reçu, on relance le cadrage."
            }
        ]
    }
];

export const activities: Activity[] = [
    {
        id: "act-1",
        type: "appel",
        title: "Relancer Amine sur DV-2026-0047",
        dueAt: "2026-09-30T09:30:00+01:00",
        ownerId: "owner-eo",
        dealId: "deal-modernisation-crm",
        contactId: "contact-amine-benali",
        status: "open"
    },
    {
        id: "act-2",
        type: "reunion",
        title: "Négociation CRM & Support",
        dueAt: "2026-09-30T14:00:00+01:00",
        ownerId: "owner-rc",
        dealId: "deal-crm-support",
        contactId: "contact-lina-haddad",
        status: "open"
    },
    {
        id: "act-3",
        type: "email",
        title: "Envoyer addendum Digitalisation",
        dueAt: "2026-10-01T10:00:00+01:00",
        ownerId: "owner-mt",
        dealId: "deal-digitalisation",
        contactId: "contact-samir-belkacem",
        status: "open"
    },
    {
        id: "act-4",
        type: "appel",
        title: "Point Pharmacie Centrale",
        dueAt: "2026-10-02T11:00:00+01:00",
        ownerId: "owner-sk",
        dealId: "deal-solution-commerciale",
        contactId: "contact-karim-mansouri",
        status: "open"
    },
    {
        id: "act-5",
        type: "tache",
        title: "Onboarding Clinique El Yasmin",
        dueAt: "2026-10-03T09:00:00+01:00",
        ownerId: "owner-eo",
        dealId: "deal-deploiement-national",
        contactId: "contact-nadia-khelifi",
        status: "open"
    }
];

export const outboundSequences: OutboundSequence[] = [
    {
        id: "out-relance-devis",
        name: "Relance devis cliniques",
        status: "active",
        enrolledContactIds: [
            "contact-amine-benali",
            "contact-lina-haddad",
            "contact-samir-belkacem"
        ],
        sent: 9,
        replies: 4
    },
    {
        id: "out-ads-followup",
        name: "Suivi leads Ads septembre",
        status: "active",
        enrolledContactIds: [
            "contact-amine-benali",
            "contact-anis-messaoudi-wa-lost-1",
            "contact-kahina-hamdi-wa-lost-2",
            "contact-reda-belaid-wa-lost-3",
            "contact-imane-benkhaled-wa-lost-4",
            "contact-hakim-lounis-wa-lost-5",
            "contact-nadia-kaci-wa-lost-6",
            "contact-lotfi-mansouri-wa-lost-7",
            "contact-salima-benali-wa-lost-8",
            "contact-youcef-boudiaf-site-lost-1",
            "contact-fella-ziani-site-lost-2",
            "contact-karim-cherif-site-lost-3"
        ],
        sent: 24,
        replies: 7
    }
];

export const goals: Goal[] = [
    {
        id: "goal-ca",
        name: "CA gagné septembre",
        metric: "won_revenue",
        target: 1500000
    },
    {
        id: "goal-pipeline",
        name: "Pipeline ouvert",
        metric: "open_pipeline",
        target: 2500000
    },
    {
        id: "goal-roas",
        name: "ROAS Ads",
        metric: "ads_roas",
        target: 2
    },
    {
        id: "goal-quotes",
        name: "Devis envoyés",
        metric: "quotes_sent",
        target: 40
    }
];
