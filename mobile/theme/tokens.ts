/**
 * Mobile design tokens. Same brand as web, mobile metrics — not a compressed desktop.
 * Source: docs/design-system.md lock + PR #233 MOBILE-DESIGN-SYSTEM.md
 */
export const colors = {
  canvas: '#F7F7F5',
  surface: '#FFFFFF',
  subtle: '#F1F1EF',
  text: '#161616',
  secondary: '#666666',
  muted: '#929292',
  border: '#E3E3DF',
  accent: '#E8530E',
  accentPressed: '#B8410B',
  accentWash: 'rgba(232, 83, 14, 0.10)',
  danger: '#B42318',
  success: '#027A48',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  page: { fontSize: 26, fontWeight: '600' as const, lineHeight: 32 },
  section: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  meta: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;

export const metrics = {
  minTouch: 44,
  listRow: 60,
  screenPad: 16,
  radius: 10,
} as const;
