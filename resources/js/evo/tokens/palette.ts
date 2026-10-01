export type TokenSwatch = {
    token: string;
    hex: string;
    role: string;
    usage: string;
};

export const LIGHT_SWATCHES: TokenSwatch[] = [
    {
        token: '--evo-canvas',
        hex: '#F7F8F5',
        role: 'Toile',
        usage: 'Fond des espaces de travail',
    },
    {
        token: '--evo-surface',
        hex: '#FFFFFF',
        role: 'Surface',
        usage: 'Cartes, panneaux, champs',
    },
    {
        token: '--evo-surface-subtle',
        hex: '#F1F2EE',
        role: 'Surface basse',
        usage: 'Puits, chips, secondaire',
    },
    {
        token: '--evo-ink',
        hex: '#0D1B24',
        role: 'Encre',
        usage: 'Texte, structure, axes',
    },
    {
        token: '--evo-ink-secondary',
        hex: '#4A5A63',
        role: 'Encre secondaire',
        usage: 'Sous-titres, méta',
    },
    {
        token: '--evo-ink-muted',
        hex: '#5B6B73',
        role: 'Encre atténuée',
        usage: 'Captions (AA 5.19:1)',
    },
    {
        token: '--evo-hairline',
        hex: '#E6E8E3',
        role: 'Filet',
        usage: 'Bordures, séparateurs',
    },
    {
        token: '--evo-teal',
        hex: '#0F4C5C',
        role: 'Sarcelle',
        usage: 'Focus, sélection, actif',
    },
    {
        token: '--evo-primary',
        hex: '#EC6025',
        role: 'Orange',
        usage: 'Actions primaires seulement',
    },
    {
        token: '--evo-on-primary',
        hex: '#121212',
        role: 'Sur orange',
        usage: 'Libellé des boutons primaires',
    },
    {
        token: '--evo-logo',
        hex: '#D9500F',
        role: 'Logo',
        usage: 'Marque uniquement, jamais un bouton',
    },
];

export const DARK_SWATCHES: TokenSwatch[] = [
    {
        token: '--evo-canvas',
        hex: '#0A0A0A',
        role: 'Toile',
        usage: 'Cabinet / thème sombre',
    },
    {
        token: '--evo-surface',
        hex: '#121212',
        role: 'Surface',
        usage: 'Panneaux relevés',
    },
    {
        token: '--evo-surface-raised',
        hex: '#1C1C1C',
        role: 'Surface +2',
        usage: 'Dialogues, popovers',
    },
    {
        token: '--evo-ink',
        hex: '#F5F5F5',
        role: 'Encre',
        usage: 'Texte principal (pas du blanc pur)',
    },
    {
        token: '--evo-ink-secondary',
        hex: '#A3A3A3',
        role: 'Encre secondaire',
        usage: 'Méta, secondaire',
    },
    {
        token: '--evo-ink-muted',
        hex: '#8A8A8A',
        role: 'Encre atténuée',
        usage: 'Captions',
    },
    {
        token: '--evo-hairline',
        hex: '#262626',
        role: 'Filet',
        usage: 'Bordures tonales',
    },
    {
        token: '--evo-focus',
        hex: '#5EB0C0',
        role: 'Focus',
        usage: 'Anneau et contour sélection',
    },
    {
        token: '--evo-primary',
        hex: '#EC6025',
        role: 'Orange',
        usage: 'Actions primaires',
    },
];

export const TYPE_SCALE = [11, 12, 13, 14, 16, 18, 20, 24, 32] as const;

export const TYPE_ROLES = [
    { role: 'Caption', size: 11, sample: 'Créé le 1 oct. 2026' },
    { role: 'Méta', size: 12, sample: 'Clinique El Djazair · Alger' },
    { role: 'Corps', size: 13, sample: 'Devis v2 envoyé — 1 280 000 DA' },
    { role: 'Interface', size: 14, sample: 'Créer une affaire' },
    { role: 'Section', size: 16, sample: 'Pipeline Q4' },
    { role: 'Section large', size: 18, sample: 'Affaires ouvertes' },
    { role: 'Page', size: 20, sample: 'Contacts' },
    { role: 'Titre', size: 24, sample: 'Clinique El Djazair' },
    { role: 'Métrique', size: 32, sample: '1 280 000 DA' },
] as const;
