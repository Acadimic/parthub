/**
 * Colours a user picks for their own data — currently the swatch on a meeting.
 *
 * These are deliberately separate from the design-system tokens in `light.ts` / `dark.ts`. Those
 * describe roles (`primary`, `destructive`, `muted`) and a role has one meaning; this is a set of
 * hues with no meaning at all beyond "the one the user chose", and it has to stay keyed by
 * `ColorType`, which is persisted on the meeting document. Folding the two together is what made
 * the old palette carry `blue-primary` as both the brand action and an event swatch.
 *
 * Keyed by `ColorType` from `@repo/shared/enums`, typed loosely as string keys so this file does
 * not pull the enum into every consumer.
 */
type EventPalette = Record<string, string | undefined>;

/** Dark enough to read as text and as a filled dot on a light surface. */
export const lightEventColors: EventPalette = {
  red: '#c81e1e',
  green: '#0a7d4b',
  blue: '#0271ad',
  yellow: '#9a5d06',
  orange: '#c2410c',
  purple: '#7e22ce',
  pink: '#be185d',
  violet: '#6d28d9',
  grey: '#556277',
};

/** Same hues lifted for a dark surface. */
export const darkEventColors: EventPalette = {
  red: '#f87171',
  green: '#4ade80',
  blue: '#4da3ff',
  yellow: '#fbbf24',
  orange: '#fb923c',
  purple: '#c084fc',
  pink: '#f472b6',
  violet: '#a78bfa',
  grey: '#94a3b8',
};

/** `undefined` when no colour is set, so a caller can leave the CSS property off entirely. */
export const getEventColor = (mode: 'light' | 'dark', color?: string): string | undefined =>
  color ? (mode === 'dark' ? darkEventColors : lightEventColors)[color] : undefined;
