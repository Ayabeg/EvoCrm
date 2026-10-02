/**
 * Paint hex that must stay as real color values (canvas gradients,
 * third-party avatar APIs). Import from here — do not repeat hex in pages.
 */

export const EVO_CHART_STAGE = [
    '#EC6025',
    '#0F4C5C',
    '#5E8A94',
    '#9AA5AB',
    '#C9CFCB',
    '#4A5A63',
] as const;

export const EVO_CHART_TRACK = '#E6E8E3';

export const GOOGLE_MARK = {
    blue: '#4285F4',
    green: '#34A853',
    yellow: '#FBBC05',
    red: '#EA4335',
} as const;

export const SOCIAL_MARK = {
    facebook: '#1877F2',
    meta: '#0081FB',
    instagram: {
        yellow: '#fdf497',
        coral: '#fd5949',
        magenta: '#d6249f',
        blue: '#285AEB',
    },
    whatsapp: '#25D366',
    whatsappBusiness: '#128C7E',
    onMark: '#ffffff',
} as const;

export const AVATAR_TONE_HEX = {
    orange: '#EC6025',
    teal: '#0F4C5C',
    ink: '#0D1B24',
} as const;
