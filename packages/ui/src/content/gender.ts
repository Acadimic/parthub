import type { WordGender } from '@repo/shared/utils';

/**
 * A word's grammatical gender as a colour, the same everywhere a learner meets the word: text,
 * tiles, cards and labels. Categorical chart tokens, never a status colour, and always beside a
 * letter or a name somewhere, so colour is never the only signal.
 */
export const GENDER_TEXT: Record<WordGender, string> = { m: 'text-chart-1', f: 'text-chart-4', n: 'text-chart-2' };
export const GENDER_BORDER: Record<WordGender, string> = {
  m: 'border-chart-1',
  f: 'border-chart-4',
  n: 'border-chart-2',
};
export const GENDER_FILL: Record<WordGender, string> = { m: 'bg-chart-1', f: 'bg-chart-4', n: 'bg-chart-2' };
export const GENDER_TINT: Record<WordGender, string> = { m: 'bg-chart-1/10', f: 'bg-chart-4/10', n: 'bg-chart-2/10' };
